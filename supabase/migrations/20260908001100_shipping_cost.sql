-- Shipping cost at the time of sale (client request 2026-09-08: "هزینه ارسال را باید در موقع فروش لحاظ کنیم").
-- The customer already pays `orders.shipping_total`; this records what the STORE pays the courier so
-- finance nets it against the sale. Captured from the chosen rate at checkout, editable when shipping.

alter table public.shipping_rates
  add column cost integer not null default 0 check (cost >= 0);        -- minor units, per shipment

alter table public.orders
  add column shipping_cost integer not null default 0 check (shipping_cost >= 0);

-- Daily sales: expose the courier cost next to COGS (columns appended, so dependent code keeps working).
create or replace view public.v_daily_sales
with (security_invoker = true) as
select
  o.store_id,
  (o.placed_at at time zone coalesce(s.timezone, 'UTC'))::date as day,
  o.currency,
  count(*) filter (where o.status not in ('cancelled'))            as orders_count,
  sum(o.subtotal)       filter (where o.status not in ('cancelled')) as subtotal,
  sum(o.discount_total) filter (where o.status not in ('cancelled')) as discounts,
  sum(o.shipping_total) filter (where o.status not in ('cancelled')) as shipping,
  sum(o.tax_total)      filter (where o.status not in ('cancelled')) as tax,
  sum(o.total)          filter (where o.status not in ('cancelled')) as gross,
  sum(o.total)          filter (where o.status in ('paid','processing','shipped','delivered')) as paid_gross,
  sum(o.refunded_total) as refunds,
  sum(oi.cogs)          filter (where o.status not in ('cancelled')) as cogs,
  sum(o.shipping_cost)  filter (where o.status not in ('cancelled')) as shipping_cost
from public.orders o
join public.stores s on s.id = o.store_id
left join lateral (
  select sum(coalesce(i.unit_cost, 0) * i.quantity) as cogs
  from public.order_items i where i.order_id = o.id
) oi on true
group by o.store_id, day, o.currency;
