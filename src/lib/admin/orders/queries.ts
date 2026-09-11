import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ListParams } from "@/lib/admin/list-params";
import type {
  OrderItemRow,
  OrderRow,
  OrderStatus,
  PaymentRow,
  PaymentStatus,
  RefundRow,
  OrderEventRow,
} from "@/lib/db/types";

export type OrderSort = "placed_at" | "total" | "number";
export const ORDER_SORTS: readonly OrderSort[] = ["placed_at", "total", "number"];

export interface OrderListRow {
  id: string;
  number: string;
  email: string;
  status: OrderStatus;
  total: number;
  currency: string;
  placed_at: string;
  paid_at: string | null;
  customer_name: string | null;
  payment_status: PaymentStatus | null;
}

export interface OrderListFilters {
  status?: OrderStatus;
  /** ISO dates (YYYY-MM-DD), inclusive. */
  from?: string;
  to?: string;
  customerId?: string;
}

/** Strip characters that would break a PostgREST `or()` filter. */
function safeLike(q: string) {
  return q.replace(/[,()%\\]/g, " ").trim();
}

export async function listOrders(storeId: string, params: ListParams<OrderSort> & OrderListFilters): Promise<{ rows: OrderListRow[]; total: number }> {
  const db = createSupabaseAdminClient();
  let q = db
    .from("orders")
    .select("id, number, email, status, total, currency, placed_at, paid_at, customers(full_name), payments(status)", { count: "exact" })
    .eq("store_id", storeId);
  if (params.status) q = q.eq("status", params.status);
  if (params.customerId) q = q.eq("customer_id", params.customerId);
  if (params.from) q = q.gte("placed_at", `${params.from}T00:00:00Z`);
  if (params.to) q = q.lte("placed_at", `${params.to}T23:59:59.999Z`);
  const term = safeLike(params.q);
  // Six digits is a delivery code: a customer reading theirs out on the phone should find their order.
  if (term) q = q.or(/^[0-9]{6}$/.test(term) ? `number.ilike.%${term}%,email.ilike.%${term}%,delivery_code.eq.${term}` : `number.ilike.%${term}%,email.ilike.%${term}%`);
  const { data, count, error } = await q.order(params.sort, { ascending: params.dir === "asc" }).range(params.range.from, params.range.to);
  if (error) throw error;
  type Raw = Omit<OrderListRow, "customer_name" | "payment_status"> & { customers: { full_name: string | null } | null; payments: { status: PaymentStatus }[] | null };
  const rows = ((data ?? []) as unknown as Raw[]).map((r) => ({
    id: r.id,
    number: r.number,
    email: r.email,
    status: r.status,
    total: r.total,
    currency: r.currency,
    placed_at: r.placed_at,
    paid_at: r.paid_at,
    customer_name: r.customers?.full_name ?? null,
    payment_status: r.payments?.[0]?.status ?? null,
  }));
  return { rows, total: count ?? 0 };
}

/** Per-status counts for the filter tabs. SCOPE(orders): counts everything; GROWS LATER → SQL aggregate. */
export async function orderStatusCounts(storeId: string): Promise<Record<OrderStatus | "all", number>> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from("orders").select("status").eq("store_id", storeId).returns<{ status: OrderStatus }[]>();
  if (error) throw error;
  const counts: Record<string, number> = { all: 0 };
  for (const r of data ?? []) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
    counts.all += 1;
  }
  return counts as Record<OrderStatus | "all", number>;
}

export interface OrderEventWithActor extends OrderEventRow {
  profiles: { full_name: string | null } | null;
}

export interface OrderDetail extends OrderRow {
  order_items: OrderItemRow[];
  payments: PaymentRow[];
  refunds: RefundRow[];
  order_events: OrderEventWithActor[];
  customers: { id: string; full_name: string | null; phone: string | null; email: string } | null;
}

export async function getOrder(storeId: string, id: string): Promise<OrderDetail | null> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("orders")
    .select("*, order_items(*), payments(*), refunds(*), order_events(*, profiles(full_name)), customers(id, full_name, phone, email)")
    .eq("store_id", storeId)
    .eq("id", id)
    .order("created_at", { referencedTable: "order_events", ascending: true })
    .maybeSingle<OrderDetail>();
  if (error) throw error;
  return data ?? null;
}
