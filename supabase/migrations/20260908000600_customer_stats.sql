-- ============================================================================
-- 0006 CUSTOMER STATS: customers joined with their order aggregates (admin list + detail)
-- security_invoker so the RLS policies on customers / orders apply to the caller.
-- ============================================================================
create or replace view public.v_customer_stats
with (security_invoker = true) as
select
  c.id,
  c.store_id,
  c.user_id,
  c.email,
  c.full_name,
  c.phone,
  c.accepts_marketing,
  c.notes,
  c.created_at,
  c.updated_at,
  coalesce(o.orders_count, 0)::integer as orders_count,
  coalesce(o.total_spent, 0)::bigint   as total_spent,
  o.last_order_at
from public.customers c
left join (
  select
    customer_id,
    count(*) filter (where status <> 'cancelled')                                          as orders_count,
    sum(total) filter (where status in ('paid', 'processing', 'shipped', 'delivered'))     as total_spent,
    max(placed_at) filter (where status <> 'cancelled')                                    as last_order_at
  from public.orders
  where customer_id is not null
  group by customer_id
) o on o.customer_id = c.id;

comment on view public.v_customer_stats is
  'Customers with orders_count (non-cancelled), total_spent (paid→delivered) and last_order_at. RLS of the base tables applies.';
