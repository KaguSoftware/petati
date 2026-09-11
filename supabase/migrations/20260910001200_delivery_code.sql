-- Delivery confirmation code (client request 2026-09-10: "به نظرم می‌شه با یک کد که زمان سفارش تولید می‌شه
-- و در نهایت به عنوان یک رسید هم تلقی بشه" — marking orders delivered by hand does not scale and proves nothing).
-- Every order now carries a secret 6-digit code the CUSTOMER holds. Whoever hands the parcel over enters it
-- (admin dialog, or the public /deliver page reached from the delivery slip) and the order closes itself.
-- The order number is printed on the parcel, so BOTH halves are needed to confirm, and five wrong tries lock
-- the code until staff reissue it — which is what makes an unauthenticated confirm page safe.

-- pgcrypto is installed in 0001; gen_random_bytes beats random() for anything that gates a state change.
create or replace function public.new_delivery_code()
returns text language sql volatile set search_path = public, extensions, pg_temp as $$
  select lpad((
    (get_byte(b, 0)::int * 65536 + get_byte(b, 1)::int * 256 + get_byte(b, 2)::int) % 1000000
  )::text, 6, '0')
  from (select gen_random_bytes(3) as b) s
$$;
comment on function public.new_delivery_code() is
  'Random 6-digit delivery confirmation code. Not unique: only ever checked together with the order id or number.';

alter table public.orders
  add column delivery_code text not null default public.new_delivery_code()
    check (delivery_code ~ '^[0-9]{6}$'),
  add column delivery_attempts smallint not null default 0
    check (delivery_attempts >= 0),
  -- null until delivered; 'code' = confirmed with the customer's code, 'manual' = staff marked it by hand.
  add column delivered_by text
    check (delivered_by is null or delivered_by in ('code', 'manual'));

comment on column public.orders.delivery_code is 'Secret handed to the customer; confirms delivery together with the order number.';
comment on column public.orders.delivery_attempts is 'Failed confirm attempts. At 5 the code locks until staff reissue it.';

-- No RLS change: `orders` has no anon policy (0003) and every read runs through the service-role client,
-- so the new columns are not reachable from the browser. order_events.actor_id is already nullable, which
-- is what lets the public page record a courier confirm with no signed-in actor.
