-- ============================================================================
-- 0003 COMMERCE: customers, addresses, carts, orders, payments, shipping,
--                coupons, reviews, wishlists, stock movements
-- ============================================================================
create type public.order_status as enum
  ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
create type public.payment_status as enum ('pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded');
create type public.payment_provider as enum ('manual', 'iyzico');
create type public.discount_type as enum ('percent', 'fixed', 'free_shipping');
create type public.stock_reason as enum ('initial', 'purchase', 'sale', 'return', 'adjustment', 'damaged', 'correction');
create type public.review_status as enum ('pending', 'approved', 'rejected');

-- ---------- customers (per store; guest or linked to auth user) ----------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  email citext not null,
  full_name text,
  phone text,
  accepts_marketing boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, email)
);
create index customers_user_idx on public.customers(user_id);
create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text,
  full_name text not null,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  region text,
  postal_code text,
  country char(2) not null default 'TR',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_customer_idx on public.addresses(customer_id);

-- ---------- shipping ----------
create table public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name jsonb not null,                              -- {"en":"Standard","tr":"Standart","fa":"استاندارد"}
  rate integer not null default 0 check (rate >= 0),                -- minor units
  free_over integer check (free_over is null or free_over >= 0),    -- subtotal threshold for free
  countries char(2)[],                              -- null = everywhere
  min_days integer,
  max_days integer,
  is_active boolean not null default true,
  sort_order integer not null default 0
);
create index shipping_rates_store_idx on public.shipping_rates(store_id);

-- ---------- coupons ----------
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  code citext not null,
  type public.discount_type not null,
  value integer not null default 0 check (value >= 0),  -- percent (0-100) or minor units
  min_subtotal integer,
  max_uses integer,
  max_uses_per_customer integer default 1,
  uses_count integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (store_id, code),
  check (type <> 'percent' or value <= 100)
);

-- ---------- carts ----------
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,  -- cookie for guests
  user_id uuid references public.profiles(id) on delete set null,
  coupon_id uuid references public.coupons(id) on delete set null,
  currency char(3) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index carts_user_idx on public.carts(user_id);
create trigger carts_updated_at before update on public.carts
  for each row execute function public.set_updated_at();

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

-- ---------- orders ----------
create sequence public.order_number_seq start 1000;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  number text not null,                            -- human readable, unique per store
  customer_id uuid references public.customers(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  email citext not null,
  phone text,
  locale public.locale_code not null default 'en',
  currency char(3) not null,
  status public.order_status not null default 'pending_payment',
  -- money (minor units)
  subtotal integer not null default 0,
  discount_total integer not null default 0,
  shipping_total integer not null default 0,
  tax_total integer not null default 0,
  total integer not null default 0,
  refunded_total integer not null default 0,
  -- snapshots
  coupon_code text,
  shipping_address jsonb,
  billing_address jsonb,
  shipping_method jsonb,
  customer_note text,
  internal_note text,
  tracking_number text,
  tracking_url text,
  placed_at timestamptz not null default now(),
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, number)
);
create index orders_store_status_idx on public.orders(store_id, status, placed_at desc);
create index orders_customer_idx on public.orders(customer_id);
create index orders_user_idx on public.orders(user_id);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create or replace function public.next_order_number(p_store_id uuid)
returns text language plpgsql as $$
declare n bigint;
begin
  n := nextval('public.order_number_seq');
  return to_char(now(), 'YYMM') || '-' || lpad(n::text, 5, '0');
end $$;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  -- snapshots at time of sale
  product_name text not null,
  variant_name text,
  sku text,
  image_url text,
  unit_price integer not null,
  unit_cost integer,                               -- COGS snapshot for margins
  quantity integer not null check (quantity > 0),
  line_total integer not null
);
create index order_items_order_idx on public.order_items(order_id);
create index order_items_variant_idx on public.order_items(variant_id);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  type text not null,                              -- 'status_changed','note','payment','shipment','refund'
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events(order_id, created_at);

-- ---------- payments ----------
-- SCOPE(payments): only 'manual' is wired. GROWS LATER → iyzico via src/lib/payments/iyzico.ts
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete cascade,
  provider public.payment_provider not null default 'manual',
  provider_ref text,                               -- gateway transaction id
  status public.payment_status not null default 'pending',
  amount integer not null,
  currency char(3) not null,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_idx on public.payments(order_id);
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  amount integer not null check (amount > 0),
  reason text,
  actor_id uuid references public.profiles(id),
  provider_ref text,
  created_at timestamptz not null default now()
);

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  amount integer not null default 0,
  created_at timestamptz not null default now(),
  unique (coupon_id, order_id)
);

-- ---------- inventory ----------
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  delta integer not null check (delta <> 0),
  reason public.stock_reason not null,
  order_id uuid references public.orders(id) on delete set null,
  actor_id uuid references public.profiles(id),
  note text,
  created_at timestamptz not null default now()
);
create index stock_movements_variant_idx on public.stock_movements(variant_id, created_at desc);
create index stock_movements_store_idx on public.stock_movements(store_id, created_at desc);

create or replace function public.apply_stock_movement()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.product_variants
     set stock_qty = stock_qty + new.delta
   where id = new.variant_id;
  return new;
end $$;
create trigger stock_movements_apply after insert on public.stock_movements
  for each row execute function public.apply_stock_movement();

-- ---------- reviews ----------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text,
  status public.review_status not null default 'pending',
  is_verified_purchase boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reviews_product_idx on public.reviews(product_id, status);
create trigger reviews_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

create or replace function public.refresh_product_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
     set rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.reviews r
                                where r.product_id = pid and r.status = 'approved'), 0),
         rating_count = (select count(*) from public.reviews r where r.product_id = pid and r.status = 'approved')
   where p.id = pid;
  return null;
end $$;
create trigger reviews_refresh_rating after insert or update or delete on public.reviews
  for each row execute function public.refresh_product_rating();

-- ---------- wishlists ----------
create table public.wishlist_items (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create index wishlist_items_store_user_idx on public.wishlist_items(store_id, user_id);

-- ---------- RLS ----------
alter table public.customers          enable row level security;
alter table public.addresses          enable row level security;
alter table public.shipping_rates     enable row level security;
alter table public.coupons            enable row level security;
alter table public.carts              enable row level security;
alter table public.cart_items         enable row level security;
alter table public.orders             enable row level security;
alter table public.order_items        enable row level security;
alter table public.order_events       enable row level security;
alter table public.payments           enable row level security;
alter table public.refunds            enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.stock_movements    enable row level security;
alter table public.reviews            enable row level security;
alter table public.wishlist_items     enable row level security;

create or replace function public.order_store(p_order_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select store_id from public.orders where id = p_order_id;
$$;
create or replace function public.customer_store(p_customer_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select store_id from public.customers where id = p_customer_id;
$$;
create or replace function public.customer_is_me(p_customer_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.customers c where c.id = p_customer_id and c.user_id = auth.uid());
$$;

-- customers: self read/update; staff of the store read; managers write
create policy "customers: read" on public.customers for select
  using (user_id = auth.uid() or public.has_store_access(store_id, 'staff'));
create policy "customers: self update" on public.customers for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "customers: manager write" on public.customers for all
  using (public.has_store_access(store_id, 'manager')) with check (public.has_store_access(store_id, 'manager'));

create policy "addresses: self all" on public.addresses for all
  using (public.customer_is_me(customer_id)) with check (public.customer_is_me(customer_id));
create policy "addresses: staff read" on public.addresses for select
  using (public.has_store_access(public.customer_store(customer_id), 'staff'));

-- shipping rates & coupons: public read active (storefront), managers write
create policy "shipping_rates: read" on public.shipping_rates for select
  using ((is_active and public.store_is_public(store_id)) or public.has_store_access(store_id, 'staff'));
create policy "shipping_rates: manager write" on public.shipping_rates for all
  using (public.has_store_access(store_id, 'manager')) with check (public.has_store_access(store_id, 'manager'));

-- coupons are validated server-side with the service role; storefront cannot enumerate them
create policy "coupons: staff read" on public.coupons for select
  using (public.has_store_access(store_id, 'staff'));
create policy "coupons: manager write" on public.coupons for all
  using (public.has_store_access(store_id, 'manager')) with check (public.has_store_access(store_id, 'manager'));

-- carts: managed by server actions via service role (guest token in cookie). Logged-in users may read their own.
create policy "carts: self read" on public.carts for select using (user_id = auth.uid());
create policy "cart_items: self read" on public.cart_items for select
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

-- orders: customer sees own; staff see store's; managers/staff update (status flow); inserts via service role
create policy "orders: read" on public.orders for select
  using (user_id = auth.uid() or public.has_store_access(store_id, 'staff'));
create policy "orders: staff update" on public.orders for update
  using (public.has_store_access(store_id, 'staff')) with check (public.has_store_access(store_id, 'staff'));

create policy "order_items: read" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id
                 and (o.user_id = auth.uid() or public.has_store_access(o.store_id, 'staff'))));

create policy "order_events: staff read" on public.order_events for select
  using (public.has_store_access(public.order_store(order_id), 'staff'));
create policy "order_events: staff insert" on public.order_events for insert
  with check (public.has_store_access(public.order_store(order_id), 'staff'));

create policy "payments: read" on public.payments for select
  using (public.has_store_access(store_id, 'staff')
         or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "payments: manager write" on public.payments for all
  using (public.has_store_access(store_id, 'manager')) with check (public.has_store_access(store_id, 'manager'));

create policy "refunds: manager all" on public.refunds for all
  using (public.has_store_access(public.order_store(order_id), 'manager'))
  with check (public.has_store_access(public.order_store(order_id), 'manager'));

create policy "coupon_redemptions: staff read" on public.coupon_redemptions for select
  using (public.has_store_access(public.order_store(order_id), 'staff'));

-- stock: staff may read and record movements (their core job); nobody updates/deletes movements
create policy "stock_movements: staff read" on public.stock_movements for select
  using (public.has_store_access(store_id, 'staff'));
create policy "stock_movements: staff insert" on public.stock_movements for insert
  with check (public.has_store_access(store_id, 'staff') and actor_id = auth.uid());

-- reviews: public reads approved; author reads own; logged-in users insert own; managers moderate
create policy "reviews: read" on public.reviews for select
  using ((status = 'approved' and public.product_is_public(product_id))
         or user_id = auth.uid()
         or public.has_store_access(store_id, 'staff'));
create policy "reviews: user insert" on public.reviews for insert
  with check (user_id = auth.uid() and public.product_is_public(product_id));
create policy "reviews: manager moderate" on public.reviews for update
  using (public.has_store_access(store_id, 'manager')) with check (public.has_store_access(store_id, 'manager'));
create policy "reviews: manager delete" on public.reviews for delete
  using (user_id = auth.uid() or public.has_store_access(store_id, 'manager'));

-- wishlists: strictly personal
create policy "wishlist_items: self all" on public.wishlist_items for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
