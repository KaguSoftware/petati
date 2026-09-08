-- Brands: a second taxonomy next to categories (client request 2026-09-08: "Royal Canin, Gourmet, …").
-- Replaces the free-text products.brand column with a proper per-store table.

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  slug citext not null,
  name text not null,
  logo_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);
create index brands_store_idx on public.brands(store_id);
create trigger brands_updated_at before update on public.brands
  for each row execute function public.set_updated_at();

alter table public.products add column brand_id uuid references public.brands(id) on delete set null;
create index products_brand_idx on public.products(brand_id);

-- Carry existing free-text brands over as rows, then drop the column.
insert into public.brands (store_id, slug, name)
select distinct on (store_id, lower(brand))
       store_id,
       trim(both '-' from lower(regexp_replace(brand, '[^a-zA-Z0-9]+', '-', 'g'))),
       trim(brand)
from public.products
where brand is not null and trim(brand) <> ''
on conflict (store_id, slug) do nothing;

update public.products p
set brand_id = b.id
from public.brands b
where b.store_id = p.store_id and lower(b.name) = lower(trim(p.brand));

alter table public.products drop column brand;

-- RLS: same shape as categories (public read when active + store public; staff read; manager write).
alter table public.brands enable row level security;
create policy "brands: read" on public.brands for select
  using ((is_active and public.store_is_public(store_id)) or public.has_store_access(store_id, 'staff'));
create policy "brands: manager write" on public.brands for all
  using (public.has_store_access(store_id, 'manager')) with check (public.has_store_access(store_id, 'manager'));
