-- ============================================================================
-- 0001 PLATFORM: extensions, profiles, stores, domains, members, helpers
-- ============================================================================
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------- enums ----------
create type public.platform_role as enum ('owner');
create type public.store_role as enum ('manager', 'staff');
create type public.locale_code as enum ('en', 'tr', 'fa');

-- ---------- utility: updated_at ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- profiles (1:1 with auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext,
  full_name text,
  avatar_url text,
  platform_role public.platform_role,             -- 'owner' = super admin over all stores
  preferred_locale public.locale_code default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- stores (tenant root) ----------
-- SCOPE(multi-store, unpaid): the platform supports many stores from day one.
-- The UI to create more than one is hidden behind FEATURE_MULTI_STORE. GROWS LATER → visible wizard.
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,                     -- subdomain + path key, e.g. "default"
  name text not null,
  tagline text,
  logo_url text,
  favicon_url text,
  currency char(3) not null default 'TRY',         -- ISO 4217; amounts stored in minor units
  default_locale public.locale_code not null default 'en',
  enabled_locales public.locale_code[] not null default '{en,tr,fa}',
  timezone text not null default 'Europe/Istanbul',
  contact_email citext,
  contact_phone text,
  email_from text,                                 -- sender for transactional mail
  tax_rate_bp integer not null default 0 check (tax_rate_bp between 0 and 10000), -- basis points (2000 = 20%)
  prices_include_tax boolean not null default true,
  low_stock_threshold integer not null default 5,
  theme jsonb not null default '{}'::jsonb,        -- see src/lib/theme/types.ts
  settings jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger stores_updated_at before update on public.stores
  for each row execute function public.set_updated_at();

-- custom domains attached to a store (resolved by src/proxy.ts)
create table public.store_domains (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  hostname citext not null unique,                 -- "shop.example.com"
  is_primary boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index store_domains_store_idx on public.store_domains(store_id);

-- staff membership per store
create table public.store_members (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.store_role not null default 'staff',
  invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);
create index store_members_user_idx on public.store_members(user_id);

-- ---------- authorization helpers (used by RLS + server code) ----------
create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.platform_role = 'owner'
  );
$$;

-- Returns 'owner' | 'manager' | 'staff' | null for the current user on a store.
create or replace function public.store_role_for(p_store_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select case
    when public.is_owner() then 'owner'
    else (select m.role::text from public.store_members m
          where m.store_id = p_store_id and m.user_id = auth.uid())
  end;
$$;

-- min_role: 'staff' (any member), 'manager' (manager or owner), 'owner'
create or replace function public.has_store_access(p_store_id uuid, p_min_role text default 'staff')
returns boolean language sql stable security definer set search_path = public as $$
  select case p_min_role
    when 'owner'   then public.store_role_for(p_store_id) = 'owner'
    when 'manager' then public.store_role_for(p_store_id) in ('owner', 'manager')
    else                public.store_role_for(p_store_id) in ('owner', 'manager', 'staff')
  end;
$$;

-- store ids the current user can administer
create or replace function public.my_store_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select s.id from public.stores s where public.is_owner()
  union
  select m.store_id from public.store_members m where m.user_id = auth.uid();
$$;

-- ---------- RLS ----------
alter table public.profiles      enable row level security;
alter table public.stores        enable row level security;
alter table public.store_domains enable row level security;
alter table public.store_members enable row level security;

-- profiles: self read/update; owner reads all; store admins read members of their stores
create policy "profiles: self select" on public.profiles for select
  using (id = auth.uid() or public.is_owner()
         or exists (select 1 from public.store_members m
                    where m.user_id = profiles.id and public.has_store_access(m.store_id, 'manager')));
create policy "profiles: self update" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and platform_role is not distinct from
    (select platform_role from public.profiles where id = auth.uid()));

-- stores: public can read active stores (storefront); admins read theirs; owner writes; managers update
create policy "stores: public read active" on public.stores for select
  using (is_active or public.has_store_access(id, 'staff'));
create policy "stores: owner insert" on public.stores for insert
  with check (public.is_owner());
create policy "stores: manager update" on public.stores for update
  using (public.has_store_access(id, 'manager')) with check (public.has_store_access(id, 'manager'));
create policy "stores: owner delete" on public.stores for delete
  using (public.is_owner());

-- domains: public read (proxy resolution uses service role anyway), owner manages
create policy "store_domains: public read" on public.store_domains for select using (true);
create policy "store_domains: owner all" on public.store_domains for all
  using (public.is_owner()) with check (public.is_owner());

-- members: members of a store see each other; managers manage staff; owner manages all
create policy "store_members: read" on public.store_members for select
  using (user_id = auth.uid() or public.has_store_access(store_id, 'staff'));
create policy "store_members: manager write" on public.store_members for insert
  with check (public.has_store_access(store_id, 'manager'));
create policy "store_members: manager update" on public.store_members for update
  using (public.has_store_access(store_id, 'manager')) with check (public.has_store_access(store_id, 'manager'));
create policy "store_members: manager delete" on public.store_members for delete
  using (public.has_store_access(store_id, 'manager'));
