-- ============================================================================
-- 0004 FINANCE: manual expenses + reporting views
-- ============================================================================
create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  unique (store_id, name)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.expense_categories(id) on delete set null,
  amount integer not null check (amount > 0),      -- minor units, store currency
  currency char(3) not null,
  spent_on date not null default current_date,
  vendor text,
  note text,
  receipt_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index expenses_store_date_idx on public.expenses(store_id, spent_on desc);
create trigger expenses_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

alter table public.expense_categories enable row level security;
alter table public.expenses           enable row level security;

-- Finance is manager+ only. Staff never see money reports.
create policy "expense_categories: manager all" on public.expense_categories for all
  using (public.has_store_access(store_id, 'manager')) with check (public.has_store_access(store_id, 'manager'));
create policy "expenses: manager all" on public.expenses for all
  using (public.has_store_access(store_id, 'manager')) with check (public.has_store_access(store_id, 'manager'));

-- ---------- reporting views (security_invoker so RLS on orders applies) ----------
create or replace view public.v_daily_sales
with (security_invoker = true) as
select
  o.store_id,
  (o.placed_at at time zone coalesce(s.timezone, 'UTC'))::date as day,
  o.currency,
  count(*) filter (where o.status not in ('cancelled'))            as orders_count,
  sum(o.subtotal)       filter (where o.status not in ('cancelled')) as subtotal,
  sum(o.discount_total) filter (where o.status not in ('cancelled')) as discounts,
  sum(o.shipping_total) filter (where o.status not in ('cancelled')) as shipping,
  sum(o.tax_total)      filter (where o.status not in ('cancelled')) as tax,
  sum(o.total)          filter (where o.status not in ('cancelled')) as gross,
  sum(o.total)          filter (where o.status in ('paid','processing','shipped','delivered')) as paid_gross,
  sum(o.refunded_total) as refunds,
  sum(oi.cogs)          filter (where o.status not in ('cancelled')) as cogs
from public.orders o
join public.stores s on s.id = o.store_id
left join lateral (
  select sum(coalesce(i.unit_cost, 0) * i.quantity) as cogs
  from public.order_items i where i.order_id = o.id
) oi on true
group by o.store_id, day, o.currency;

create or replace view public.v_product_margins
with (security_invoker = true) as
select
  o.store_id,
  i.product_id,
  i.variant_id,
  max(i.product_name)  as product_name,
  max(i.sku)           as sku,
  sum(i.quantity)      as units_sold,
  sum(i.line_total)    as revenue,
  sum(coalesce(i.unit_cost, 0) * i.quantity) as cogs,
  sum(i.line_total) - sum(coalesce(i.unit_cost, 0) * i.quantity) as gross_margin
from public.order_items i
join public.orders o on o.id = i.order_id
where o.status in ('paid','processing','shipped','delivered')
group by o.store_id, i.product_id, i.variant_id;

create or replace view public.v_low_stock
with (security_invoker = true) as
select v.store_id, v.product_id, v.id as variant_id, v.sku, v.stock_qty, s.low_stock_threshold
from public.product_variants v
join public.stores s on s.id = v.store_id
where v.track_inventory and v.is_active and v.stock_qty <= s.low_stock_threshold;
