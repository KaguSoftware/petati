-- Run with: npx supabase test db   (needs the local stack running)
begin;
create schema if not exists tests;
select plan(12);

-- helpers to impersonate users (user lookup runs as definer so it works from the anon role)
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

-- anon: sees active products of the active store, no coupons, no orders
select tests.clear_auth();
select ok((select count(*) from public.products) > 0, 'anon can read active products');
select is((select count(*)::int from public.coupons), 0, 'anon cannot read coupons');
select is((select count(*)::int from public.orders), 0, 'anon cannot read orders');

-- staff: reads coupons of own store, cannot read expenses
select tests.authenticate_as('staff@petati.local');
select ok((select count(*) from public.coupons) > 0, 'staff can read store coupons');
select is((select count(*)::int from public.expense_categories), 0, 'staff cannot read finance');
select ok(public.has_store_access('10000000-0000-0000-0000-000000000001', 'staff'), 'staff has staff access');
select ok(not public.has_store_access('10000000-0000-0000-0000-000000000001', 'manager'), 'staff lacks manager access');

-- manager: finance visible
select tests.authenticate_as('manager@petati.local');
select ok((select count(*) from public.expense_categories) > 0, 'manager can read finance');

-- owner: platform owner on any store
select tests.authenticate_as('owner@petati.local');
select is(public.store_role_for('10000000-0000-0000-0000-000000000001'), 'owner', 'owner role resolves');
select ok(public.is_owner(), 'owner flag set');

-- phone constraints (owner session; RLS self-update)
select throws_ok(
  $$ update public.profiles set phone = 'abc' where id = '00000000-0000-0000-0000-000000000001' $$,
  '23514', null, 'phone must be E.164');
select throws_ok(
  $$ update public.profiles set phone = '+905550000002' where id = '00000000-0000-0000-0000-000000000001' $$,
  '23505', null, 'phone must be unique');

select * from finish();
rollback;
