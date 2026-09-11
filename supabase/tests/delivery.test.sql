-- Delivery module: RLS, the one-open-delivery rule, and the append-only event log.
-- Run with: npx supabase test db
begin;
create schema if not exists tests;
select plan(12);

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

-- fixtures (as postgres)
insert into public.couriers (id, store_id, name, phone)
values ('20000000-0000-0000-0000-0000000000c1', '10000000-0000-0000-0000-000000000001', 'Test Courier', '+905000000000');

insert into public.orders (id, store_id, number, email, currency, status, subtotal, total)
values ('20000000-0000-0000-0000-0000000000d1', '10000000-0000-0000-0000-000000000001', 'TEST-DEL-01', 'courier@petitati.local', 'TRY', 'shipped', 5000, 5000);

insert into public.deliveries (id, store_id, order_id, courier_id, state, cash_expected)
values ('20000000-0000-0000-0000-0000000000e1', '10000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-0000000000d1', '20000000-0000-0000-0000-0000000000c1', 'assigned', 5000);

-- defaults
select matches((select token::text from public.couriers where id = '20000000-0000-0000-0000-0000000000c1'),
  '^[0-9a-f-]{36}$', 'a courier gets an unguessable token from the column default');
select ok((select is_active from public.couriers where id = '20000000-0000-0000-0000-0000000000c1'),
  'a courier starts active');
select is((select attempt_no from public.deliveries where id = '20000000-0000-0000-0000-0000000000e1'), 1::smallint,
  'a delivery starts at attempt 1');
select ok(not (select verified from public.deliveries where id = '20000000-0000-0000-0000-0000000000e1'),
  'a delivery is unverified until the customer''s code closes it');

-- one open delivery per order
select throws_ok(
  $$insert into public.deliveries (store_id, order_id, state)
    values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-0000000000d1', 'pending')$$,
  '23505', null, 'a second OPEN delivery for the same order is rejected');

update public.deliveries set state = 'failed', completed_at = now() where id = '20000000-0000-0000-0000-0000000000e1';
select lives_ok(
  $$insert into public.deliveries (store_id, order_id, state, attempt_no)
    values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-0000000000d1', 'pending', 2)$$,
  'once the attempt is closed, a redelivery is allowed');

-- the event log accepts a row with no staff actor (the courier has no profile)
select lives_ok(
  $$insert into public.delivery_events (store_id, delivery_id, type, courier_id)
    values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-0000000000e1', 'delivered',
            '20000000-0000-0000-0000-0000000000c1')$$,
  'a courier-written event needs no actor_id');

-- anon sees nothing: the courier page reads through the service role, never the browser
select tests.clear_auth();
select is((select count(*)::int from public.couriers), 0, 'anon cannot read couriers (the token is unreachable)');
select is((select count(*)::int from public.deliveries), 0, 'anon cannot read deliveries');
select is((select count(*)::int from public.delivery_events), 0, 'anon cannot read the delivery log');

-- staff can dispatch; only managers settle cash
select tests.authenticate_as('staff@petitati.local');
select ok((select count(*) from public.deliveries) > 0, 'staff see their store''s deliveries');
select throws_ok(
  $$insert into public.delivery_settlements (store_id, courier_id, amount, currency, settled_by)
    values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-0000000000c1', 100, 'TRY',
            tests.user_id('staff@petitati.local'))$$,
  '42501', null, 'staff cannot settle cash: that is a manager act');

select * from finish();
rollback;
