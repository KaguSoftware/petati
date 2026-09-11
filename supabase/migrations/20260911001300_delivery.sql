-- Delivery module (client request 2026-09-11: "allow actions with that for the admins … have a new tab
-- regarding delivery … make the کد تحویل worth having and actually useful").
--
-- The delivery code shipped on 2026-09-10 could only be spent: one dialog, one public page, one flip of
-- orders.status. Nothing recorded WHO carried the parcel, what happened when nobody answered the door, or
-- what cash changed hands — and the live payment provider is `manual`, so cash at the door is the norm.
--
-- Four tables:
--   couriers             people who carry parcels. Not staff accounts: a courier has no login, only an
--                        unguessable token that addresses their own stop list.
--   deliveries           one row per delivery JOB. An order may need several over time (first attempt
--                        failed, redelivered tomorrow), so the history survives; a partial unique index
--                        keeps exactly one of them open at a time.
--   delivery_events      append-only log, modelled on stock_movements: nullable actor_id because the
--                        courier who wrote the row has no profile, with courier_id saying who instead.
--   delivery_settlements a courier handing collected cash back to the store.
--
-- orders.status is deliberately untouched: a failed attempt is a DELIVERY state, never an order state,
-- and an order still only becomes 'delivered' through src/lib/delivery/confirm.ts.

create type public.delivery_state as enum
  ('pending', 'assigned', 'out_for_delivery', 'delivered', 'failed', 'returned', 'cancelled');

create type public.delivery_failure as enum
  ('no_answer', 'wrong_address', 'refused', 'postponed', 'unsafe', 'other');

-- ---------- couriers ----------
create table public.couriers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  phone text,                                        -- E.164, normalised by src/lib/phone/normalize.ts
  vehicle text check (vehicle is null or vehicle in ('motorbike', 'car', 'van', 'bicycle', 'on_foot')),
  -- A courier who also happens to be staff can be linked to their profile; most never will be.
  user_id uuid references public.profiles(id) on delete set null,
  -- The private link. uuid4 ≈ 122 bits, so unlike the 6-digit delivery code it needs no lockout;
  -- it is PII-bearing though (names, addresses, phones), hence is_active + rotation.
  token uuid not null default gen_random_uuid() unique,
  token_issued_at timestamptz not null default now(),
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index couriers_store_idx on public.couriers(store_id, is_active);
create trigger couriers_updated_at before update on public.couriers
  for each row execute function public.set_updated_at();

-- ---------- settlements (created before deliveries: deliveries.settlement_id points here) ----------
create table public.delivery_settlements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  courier_id uuid not null references public.couriers(id) on delete restrict,
  amount integer not null check (amount >= 0),       -- minor units, store currency
  currency char(3) not null,
  deliveries_count integer not null default 0,
  settled_by uuid references public.profiles(id),
  note text,
  created_at timestamptz not null default now()
);
create index delivery_settlements_store_idx on public.delivery_settlements(store_id, created_at desc);
create index delivery_settlements_courier_idx on public.delivery_settlements(courier_id, created_at desc);

-- ---------- deliveries ----------
create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  courier_id uuid references public.couriers(id) on delete set null,
  state public.delivery_state not null default 'pending',
  scheduled_for date,
  slot text,                                         -- a key from stores.settings.delivery.slots
  sort_order integer not null default 0,             -- stop order within a courier's day
  attempt_no smallint not null default 1 check (attempt_no > 0),
  -- money collected at the door; 0 when the order is already paid
  cash_expected integer not null default 0 check (cash_expected >= 0),
  cash_collected integer check (cash_collected is null or cash_collected >= 0),
  settlement_id uuid references public.delivery_settlements(id) on delete set null,
  -- true only when the customer's delivery code was used; false = a flagged exception
  verified boolean not null default false,
  recipient_name text,
  failure_reason public.delivery_failure,
  note text,
  photo_url text,
  lat numeric(9, 6), lng numeric(9, 6),
  assigned_at timestamptz,
  dispatched_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- An order can be delivered many times over its life, but never be out with two couriers at once.
create unique index deliveries_one_open_per_order on public.deliveries(order_id)
  where state in ('pending', 'assigned', 'out_for_delivery');
create index deliveries_board_idx on public.deliveries(store_id, state, scheduled_for);
create index deliveries_run_idx on public.deliveries(courier_id, scheduled_for, sort_order);
create index deliveries_order_idx on public.deliveries(order_id, created_at desc);
create index deliveries_cash_idx on public.deliveries(store_id, courier_id)
  where settlement_id is null and cash_collected is not null;
create trigger deliveries_updated_at before update on public.deliveries
  for each row execute function public.set_updated_at();

-- ---------- events (append-only) ----------
create table public.delivery_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  type text not null,                                -- 'created','assigned','dispatched','delivered',…
  data jsonb not null default '{}'::jsonb,
  actor_id uuid references public.profiles(id),      -- null when a courier wrote it
  courier_id uuid references public.couriers(id) on delete set null,
  created_at timestamptz not null default now()      -- no updated_at: rows never change
);
create index delivery_events_delivery_idx on public.delivery_events(delivery_id, created_at desc);
create index delivery_events_store_idx on public.delivery_events(store_id, created_at desc);

-- ---------- RLS ----------
alter table public.couriers             enable row level security;
alter table public.deliveries           enable row level security;
alter table public.delivery_events      enable row level security;
alter table public.delivery_settlements enable row level security;

-- Staff dispatch and complete deliveries; only managers create couriers or rotate a link.
create policy "couriers: staff read" on public.couriers for select
  using (public.has_store_access(store_id, 'staff'));
create policy "couriers: manager write" on public.couriers for all
  using (public.has_store_access(store_id, 'manager')) with check (public.has_store_access(store_id, 'manager'));

create policy "deliveries: staff all" on public.deliveries for all
  using (public.has_store_access(store_id, 'staff')) with check (public.has_store_access(store_id, 'staff'));

-- Append-only under RLS: read + insert, no update or delete policy at all.
create policy "delivery_events: staff read" on public.delivery_events for select
  using (public.has_store_access(store_id, 'staff'));
create policy "delivery_events: staff insert" on public.delivery_events for insert
  with check (public.has_store_access(store_id, 'staff'));

-- Settling cash is a money movement: managers only, like expenses.
create policy "delivery_settlements: manager all" on public.delivery_settlements for all
  using (public.has_store_access(store_id, 'manager')) with check (public.has_store_access(store_id, 'manager'));

-- No anon policy anywhere. The courier page has no session: it reads through the service-role client
-- scoped by the token, exactly like the public /deliver page added on 2026-09-10.

comment on table public.couriers is 'People who carry parcels. No login: an unguessable token addresses their stop list.';
comment on table public.deliveries is 'One delivery job per attempt cycle; a partial unique index keeps one open per order.';
comment on table public.delivery_events is 'Append-only delivery log. actor_id is null for courier-made writes; courier_id says who.';
comment on column public.deliveries.verified is 'True only when the customer''s delivery code was used. False = a flagged exception.';
