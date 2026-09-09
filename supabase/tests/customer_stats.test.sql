-- v_customer_stats: aggregates are right and the view honours RLS (security_invoker).
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

-- fixtures (as postgres, before impersonating anyone): one paid + one cancelled order for the seeded shopper
insert into public.orders (store_id, number, customer_id, email, currency, status, subtotal, total)
select c.store_id, 'TEST-00001', c.id, c.email, 'TRY', 'paid', 1500, 1500
from public.customers c where c.email = 'customer@petitati.local';
insert into public.orders (store_id, number, customer_id, email, currency, status, subtotal, total)
select c.store_id, 'TEST-00002', c.id, c.email, 'TRY', 'cancelled', 999, 999
from public.customers c where c.email = 'customer@petitati.local';

-- anon: nothing
select tests.clear_auth();
select is((select count(*)::int from public.v_customer_stats), 0, 'anon sees no customer stats');

-- staff: only own store, with aggregates
select tests.authenticate_as('staff@petitati.local');
select ok((select count(*) from public.v_customer_stats) > 0, 'staff sees customer stats of own store');
select is(
  (select count(*)::int from public.v_customer_stats where store_id <> '10000000-0000-0000-0000-000000000001'),
  0, 'staff sees no rows from other stores');
select is((select orders_count from public.v_customer_stats where email = 'customer@petitati.local'), 1,
  'cancelled orders are not counted');
select is((select total_spent from public.v_customer_stats where email = 'customer@petitati.local'), 1500::bigint,
  'total_spent sums paid orders only');
select ok((select last_order_at is not null from public.v_customer_stats where email = 'customer@petitati.local'),
  'last_order_at is set');

select * from finish();
rollback;
