-- Store creation is owner-only (SCOPE(multi-store): the hidden create-store wizard relies on this).
-- Run with: npx supabase test db
begin;
create schema if not exists tests;
select plan(6);

create or replace function tests.user_id(p_email text) returns uuid language sql security definer set search_path = auth, pg_temp as $$
  select id from auth.users where email = p_email;
$$;
create or replace function tests.authenticate_as(p_email text) returns void language plpgsql as $$
declare uid uuid;
begin
  uid := tests.user_id(p_email);
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
create or replace function tests.clear_auth() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'anon', true);
end $$;

grant usage on schema tests to anon, authenticated;
grant execute on all functions in schema tests to anon, authenticated;

-- manager: no store creation, no domain management
select tests.authenticate_as('manager@petati.local');
select throws_ok(
  $$ insert into public.stores (slug, name) values ('manager-shop', 'Manager Shop') $$,
  '42501', null, 'manager cannot insert into stores');
select throws_ok(
  $$ insert into public.store_domains (store_id, hostname) values ('10000000-0000-0000-0000-000000000001', 'manager.example.test') $$,
  '42501', null, 'manager cannot insert into store_domains');

-- staff: same
select tests.authenticate_as('staff@petati.local');
select throws_ok(
  $$ insert into public.stores (slug, name) values ('staff-shop', 'Staff Shop') $$,
  '42501', null, 'staff cannot insert into stores');

-- owner: may create a store, attach a domain, and delete it again
select tests.authenticate_as('owner@petati.local');
select lives_ok(
  $$ insert into public.stores (id, slug, name, created_by) values ('10000000-0000-0000-0000-00000000aaaa', 'owner-shop', 'Owner Shop', tests.user_id('owner@petati.local')) $$,
  'owner can insert into stores');
select lives_ok(
  $$ insert into public.store_domains (store_id, hostname, is_primary) values ('10000000-0000-0000-0000-00000000aaaa', 'owner.example.test', true) $$,
  'owner can insert into store_domains');
select lives_ok(
  $$ delete from public.stores where id = '10000000-0000-0000-0000-00000000aaaa' $$,
  'owner can delete a store');

select * from finish();
rollback;
