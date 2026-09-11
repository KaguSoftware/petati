-- Delivery confirmation code: generated on insert, shaped right, and invisible to anon.
-- Run with: npx supabase test db
begin;
create schema if not exists tests;
select plan(7);

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

-- the generator itself
select matches(public.new_delivery_code(), '^[0-9]{6}$', 'new_delivery_code() returns six digits');
select isnt(public.new_delivery_code(), public.new_delivery_code(), 'two calls do not return the same code');

-- fixtures: one order placed the way checkout places it (no delivery_code in the insert)
insert into public.orders (store_id, number, customer_id, email, currency, status, subtotal, total)
select c.store_id, 'TEST-DC-01', c.id, c.email, 'TRY', 'shipped', 2500, 2500
from public.customers c where c.email = 'customer@petitati.local';

select matches(
  (select delivery_code from public.orders where number = 'TEST-DC-01'),
  '^[0-9]{6}$', 'a new order gets a six-digit code from the column default');
select is(
  (select delivery_attempts from public.orders where number = 'TEST-DC-01'), 0::smallint,
  'attempts start at zero');
select is(
  (select delivered_by from public.orders where number = 'TEST-DC-01'), null,
  'delivered_by is null until the order is delivered');

-- the check constraint holds
select throws_ok(
  $$update public.orders set delivery_code = '12345' where number = 'TEST-DC-01'$$,
  '23514', null, 'a five-digit code is rejected');

-- anon still sees nothing: the code is only ever read through the service-role client
select tests.clear_auth();
select is((select count(*)::int from public.orders where number = 'TEST-DC-01'), 0,
  'anon cannot read orders, so the delivery code is not reachable from the browser');

select * from finish();
rollback;
