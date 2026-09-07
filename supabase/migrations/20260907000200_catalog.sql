-- ============================================================================
-- 0002 CATALOG: categories, products, translations, options, variants, images
-- ============================================================================
create type public.product_status as enum ('draft', 'active', 'archived');

-- ---------- categories ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  parent_id uuid references public.categories(id) on delete set null,
  slug citext not null,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);
create index categories_store_idx on public.categories(store_id);
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

create table public.category_translations (
  category_id uuid not null references public.categories(id) on delete cascade,
  locale public.locale_code not null,
  name text not null,
  description text,
  primary key (category_id, locale)
);

-- ---------- products ----------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  slug citext not null,
  status public.product_status not null default 'draft',
  brand text,
  tags text[] not null default '{}',
  is_featured boolean not null default false,
  rating_avg numeric(3,2) not null default 0,      -- maintained by reviews trigger
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);
create index products_store_status_idx on public.products(store_id, status);
create index products_tags_idx on public.products using gin(tags);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_translations (
  product_id uuid not null references public.products(id) on delete cascade,
  locale public.locale_code not null,
  name text not null,
  short_description text,
  description text,                                -- markdown / rich text
  seo_title text,
  seo_description text,
  primary key (product_id, locale)
);

create table public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);
create index product_categories_category_idx on public.product_categories(category_id);

-- ---------- options (e.g. Size, Colour) ----------
create table public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name jsonb not null,                             -- {"en":"Size","tr":"Beden","fa":"سایز"}
  sort_order integer not null default 0
);
create index product_options_product_idx on public.product_options(product_id);

create table public.product_option_values (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references public.product_options(id) on delete cascade,
  value jsonb not null,                            -- {"en":"Large","tr":"Büyük","fa":"بزرگ"}
  swatch text,                                     -- optional hex colour for colour options
  sort_order integer not null default 0
);
create index product_option_values_option_idx on public.product_option_values(option_id);

-- ---------- variants (the sellable unit) ----------
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sku text,
  barcode text,
  price integer not null check (price >= 0),                 -- minor units, store currency
  compare_at_price integer check (compare_at_price is null or compare_at_price >= 0),
  cost_price integer check (cost_price is null or cost_price >= 0), -- COGS for margin reports
  stock_qty integer not null default 0,                      -- cache; source of truth = stock_movements
  track_inventory boolean not null default true,
  allow_backorder boolean not null default false,
  weight_grams integer,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, sku)
);
create index product_variants_product_idx on public.product_variants(product_id);
create trigger product_variants_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();

-- which option values make up a variant (Large + Red)
create table public.variant_option_values (
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  option_value_id uuid not null references public.product_option_values(id) on delete cascade,
  primary key (variant_id, option_value_id)
);

-- ---------- images ----------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  url text not null,
  alt jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0
);
create index product_images_product_idx on public.product_images(product_id);

-- ---------- storage bucket for store media ----------
insert into storage.buckets (id, name, public)
values ('store-media', 'store-media', true)
on conflict (id) do nothing;

-- path convention: <store_id>/<anything>. Staff of that store may write.
create policy "store-media: public read" on storage.objects for select
  using (bucket_id = 'store-media');
create policy "store-media: staff write" on storage.objects for insert
  with check (bucket_id = 'store-media'
              and public.has_store_access((storage.foldername(name))[1]::uuid, 'staff'));
create policy "store-media: staff update" on storage.objects for update
  using (bucket_id = 'store-media'
         and public.has_store_access((storage.foldername(name))[1]::uuid, 'staff'));
create policy "store-media: manager delete" on storage.objects for delete
  using (bucket_id = 'store-media'
         and public.has_store_access((storage.foldername(name))[1]::uuid, 'manager'));

-- ---------- RLS ----------
-- Storefront (anon) may read active catalog of active stores. Store staff may read everything in
-- their store. Managers write. Staff may only adjust stock (see stock_movements in 0003).
alter table public.categories            enable row level security;
alter table public.category_translations enable row level security;
alter table public.products              enable row level security;
alter table public.product_translations  enable row level security;
alter table public.product_categories    enable row level security;
alter table public.product_options       enable row level security;
alter table public.product_option_values enable row level security;
alter table public.product_variants      enable row level security;
alter table public.variant_option_values enable row level security;
alter table public.product_images        enable row level security;

create or replace function public.store_is_public(p_store_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.stores s where s.id = p_store_id and s.is_active);
$$;

create or replace function public.product_is_public(p_product_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.products p join public.stores s on s.id = p.store_id
    where p.id = p_product_id and p.status = 'active' and s.is_active
  );
$$;

create or replace function public.product_store(p_product_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select store_id from public.products where id = p_product_id;
$$;

create or replace function public.category_store(p_category_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select store_id from public.categories where id = p_category_id;
$$;

-- categories
create policy "categories: read" on public.categories for select
  using ((is_active and public.store_is_public(store_id)) or public.has_store_access(store_id, 'staff'));
create policy "categories: manager write" on public.categories for all
  using (public.has_store_access(store_id, 'manager')) with check (public.has_store_access(store_id, 'manager'));
create policy "category_translations: read" on public.category_translations for select
  using (exists (select 1 from public.categories c where c.id = category_id));
create policy "category_translations: manager write" on public.category_translations for all
  using (public.has_store_access(public.category_store(category_id), 'manager'))
  with check (public.has_store_access(public.category_store(category_id), 'manager'));

-- products
create policy "products: read" on public.products for select
  using ((status = 'active' and public.store_is_public(store_id)) or public.has_store_access(store_id, 'staff'));
create policy "products: manager write" on public.products for all
  using (public.has_store_access(store_id, 'manager')) with check (public.has_store_access(store_id, 'manager'));

create policy "product_translations: read" on public.product_translations for select
  using (public.product_is_public(product_id) or public.has_store_access(public.product_store(product_id), 'staff'));
create policy "product_translations: manager write" on public.product_translations for all
  using (public.has_store_access(public.product_store(product_id), 'manager'))
  with check (public.has_store_access(public.product_store(product_id), 'manager'));

create policy "product_categories: read" on public.product_categories for select
  using (public.product_is_public(product_id) or public.has_store_access(public.product_store(product_id), 'staff'));
create policy "product_categories: manager write" on public.product_categories for all
  using (public.has_store_access(public.product_store(product_id), 'manager'))
  with check (public.has_store_access(public.product_store(product_id), 'manager'));

create policy "product_options: read" on public.product_options for select
  using (public.product_is_public(product_id) or public.has_store_access(public.product_store(product_id), 'staff'));
create policy "product_options: manager write" on public.product_options for all
  using (public.has_store_access(public.product_store(product_id), 'manager'))
  with check (public.has_store_access(public.product_store(product_id), 'manager'));

create policy "product_option_values: read" on public.product_option_values for select
  using (exists (select 1 from public.product_options o where o.id = option_id));
create policy "product_option_values: manager write" on public.product_option_values for all
  using (exists (select 1 from public.product_options o where o.id = option_id
                 and public.has_store_access(public.product_store(o.product_id), 'manager')))
  with check (exists (select 1 from public.product_options o where o.id = option_id
                 and public.has_store_access(public.product_store(o.product_id), 'manager')));

create policy "product_variants: read" on public.product_variants for select
  using ((is_active and public.product_is_public(product_id)) or public.has_store_access(store_id, 'staff'));
create policy "product_variants: manager write" on public.product_variants for all
  using (public.has_store_access(store_id, 'manager')) with check (public.has_store_access(store_id, 'manager'));

create policy "variant_option_values: read" on public.variant_option_values for select
  using (exists (select 1 from public.product_variants v where v.id = variant_id));
create policy "variant_option_values: manager write" on public.variant_option_values for all
  using (exists (select 1 from public.product_variants v where v.id = variant_id and public.has_store_access(v.store_id, 'manager')))
  with check (exists (select 1 from public.product_variants v where v.id = variant_id and public.has_store_access(v.store_id, 'manager')));

create policy "product_images: read" on public.product_images for select
  using (public.product_is_public(product_id) or public.has_store_access(public.product_store(product_id), 'staff'));
create policy "product_images: manager write" on public.product_images for all
  using (public.has_store_access(public.product_store(product_id), 'manager'))
  with check (public.has_store_access(public.product_store(product_id), 'manager'));
