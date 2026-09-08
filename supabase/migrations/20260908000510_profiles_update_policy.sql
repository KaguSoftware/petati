-- ============================================================================
-- Fix: "profiles: self update" evaluated a subquery on public.profiles inside its own policy,
-- which Postgres reports as infinite recursion (42P17) on every self-update. Read the caller's
-- platform_role through a security-definer helper instead (same pattern as is_owner()).
-- ============================================================================

create or replace function public.my_platform_role()
returns public.platform_role language sql stable security definer set search_path = public as $$
  select p.platform_role from public.profiles p where p.id = auth.uid();
$$;

drop policy if exists "profiles: self update" on public.profiles;
create policy "profiles: self update" on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and platform_role is not distinct from public.my_platform_role());
