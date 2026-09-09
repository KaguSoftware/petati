-- Brands (second taxonomy) and shipping cost: RLS + view columns.
-- Run with: npx supabase test db
begin;
create schema if not exists tests;
select plan(8);

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

-- schema
select has_column('public', 'brands', 'slug', 'brands.slug exists');
select has_column('public', 'products', 'brand_id', 'products.brand_id exists');
select hasnt_column('public', 'products', 'brand', 'free-text products.brand is gone');
select has_column('public', 'orders', 'shipping_cost', 'orders.shipping_cost exists');
select has_column('public', 'v_daily_sales', 'shipping_cost', 'v_daily_sales exposes shipping_cost');

-- anon: reads only active brands of the public store
update public.brands set is_active = false where slug = 'ferplast';
select tests.clear_auth();
select is(
  (select count(*)::int from public.brands where slug in ('royal-canin', 'ferplast')),
  1, 'anon sees active brands only');

-- customer: cannot write brands
select tests.authenticate_as('customer@petitati.local');
select throws_ok(
  $$ insert into public.brands (store_id, slug, name) values ('10000000-0000-0000-0000-000000000001', 'hacker', 'Hacker') $$,
  '42501', null, 'customer cannot insert brands');

-- manager: can write brands
select tests.authenticate_as('manager@petitati.local');
select lives_ok(
  $$ insert into public.brands (store_id, slug, name) values ('10000000-0000-0000-0000-000000000001', 'acana', 'Acana') $$,
  'manager can insert brands');

select * from finish();
rollback;
