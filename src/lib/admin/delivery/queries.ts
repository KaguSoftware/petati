import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CourierRow, DeliveryEventRow, DeliveryRow, DeliverySettlementRow, DeliveryState, OrderAddress, OrderStatus } from "@/lib/db/types";
import type { ListParams } from "@/lib/admin/list-params";
import { DELIVERABLE_STATUSES, type CourierWithLoad, type DeliveryKpis, type DeliveryListRow, type UndeliveredOrderRow } from "./types";

/**
 * Store-local calendar date (YYYY-MM-DD). A delivery day is the store's day: at 01:00 in Istanbul
 * the UTC date is still yesterday, and a board that shows yesterday's runs is useless. Callers must
 * only reach this from inside a Suspense child, after the page's runtime reads (cacheComponents).
 */
export function storeToday(timezone: string, offsetDays = 0): string {
  const d = new Date();
  if (offsetDays) d.setDate(d.getDate() + offsetDays);
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

type JoinedDelivery = DeliveryRow & {
  orders: { number: string; status: OrderStatus; total: number; currency: string; phone: string | null; shipping_address: OrderAddress | null; customers: { full_name: string | null } | null } | null;
  couriers: { name: string } | null;
};

const DELIVERY_SELECT = "*, orders(number, status, total, currency, phone, shipping_address, customers(full_name)), couriers(name)";

function flatten(row: JoinedDelivery): DeliveryListRow {
  const o = row.orders;
  const address = o?.shipping_address ?? null;
  return {
    ...(row as DeliveryRow),
    order_number: o?.number ?? "—",
    order_status: o?.status ?? "pending_payment",
    order_total: o?.total ?? 0,
    currency: o?.currency ?? "TRY",
    customer_name: o?.customers?.full_name ?? address?.full_name ?? null,
    phone: address?.phone ?? o?.phone ?? null,
    city: address?.city ?? null,
    address,
    courier_name: row.couriers?.name ?? null,
  };
}

export interface DeliveryFilters {
  states?: DeliveryState[];
  courierId?: string;
  /** Store-local dates, inclusive. */
  from?: string;
  to?: string;
  /** Only stops closed without the customer's code. */
  unverifiedOnly?: boolean;
}

export async function listDeliveries(
  storeId: string,
  params: DeliveryFilters & { range?: ListParams<"created_at">["range"]; limit?: number },
): Promise<{ rows: DeliveryListRow[]; total: number }> {
  const db = createSupabaseAdminClient();
  let q = db.from("deliveries").select(DELIVERY_SELECT, { count: "exact" }).eq("store_id", storeId);
  if (params.states?.length) q = q.in("state", params.states);
  if (params.courierId) q = q.eq("courier_id", params.courierId);
  if (params.from) q = q.gte("scheduled_for", params.from);
  if (params.to) q = q.lte("scheduled_for", params.to);
  if (params.unverifiedOnly) q = q.eq("verified", false).eq("state", "delivered");
  q = q.order("scheduled_for", { ascending: true, nullsFirst: true }).order("sort_order", { ascending: true }).order("created_at", { ascending: false });
  q = params.range ? q.range(params.range.from, params.range.to) : q.limit(params.limit ?? 50);
  const { data, error, count } = await q.returns<JoinedDelivery[]>();
  if (error) throw error;
  return { rows: (data ?? []).map(flatten), total: count ?? 0 };
}

/** One courier's stops for one day, in walking order. */
export async function listRun(storeId: string, courierId: string, date: string): Promise<DeliveryListRow[]> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("deliveries")
    .select(DELIVERY_SELECT)
    .eq("store_id", storeId)
    .eq("courier_id", courierId)
    .eq("scheduled_for", date)
    .order("sort_order", { ascending: true })
    .returns<JoinedDelivery[]>();
  if (error) throw error;
  return (data ?? []).map(flatten);
}

/**
 * Orders that ought to be moving and have no open delivery yet. This is what makes the board usable
 * on day one: nothing needs backfilling — every deliverable order simply shows up in the queue.
 */
export async function listUndeliveredOrders(storeId: string, limit = 100): Promise<UndeliveredOrderRow[]> {
  const db = createSupabaseAdminClient();
  type OrderPick = {
    id: string;
    number: string;
    status: OrderStatus;
    total: number;
    currency: string;
    placed_at: string;
    shipping_address: OrderAddress | null;
    customers: { full_name: string | null } | null;
    payments: { status: string }[];
  };
  const [{ data: orders }, { data: open }] = await Promise.all([
    db
      .from("orders")
      .select("id, number, status, total, currency, placed_at, shipping_address, customers(full_name), payments(status)")
      .eq("store_id", storeId)
      .in("status", DELIVERABLE_STATUSES as OrderStatus[])
      .order("placed_at", { ascending: true })
      .limit(limit)
      .returns<OrderPick[]>(),
    db.from("deliveries").select("order_id").eq("store_id", storeId).in("state", ["pending", "assigned", "out_for_delivery"]).returns<{ order_id: string }[]>(),
  ]);
  const taken = new Set((open ?? []).map((d) => d.order_id));
  return (orders ?? [])
    .filter((o) => !taken.has(o.id))
    .map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      total: o.total,
      currency: o.currency,
      placed_at: o.placed_at,
      customer_name: o.customers?.full_name ?? o.shipping_address?.full_name ?? null,
      city: o.shipping_address?.city ?? null,
      // Unpaid when it leaves means the courier collects at the door.
      cash_expected: (o.payments ?? []).some((p) => p.status === "paid") ? 0 : o.total,
    }));
}

/**
 * Couriers with their current load. The access token is deliberately NOT selected here: it unlocks a
 * courier's whole stop list, so only `getCourier` (behind `delivery.manage`) ever reads it.
 */
export async function listCouriers(storeId: string, includeInactive = true): Promise<CourierWithLoad[]> {
  const db = createSupabaseAdminClient();
  let q = db.from("couriers").select("id, store_id, name, phone, vehicle, user_id, token_issued_at, is_active, note, created_at, updated_at").eq("store_id", storeId);
  if (!includeInactive) q = q.eq("is_active", true);
  const [{ data: couriers, error }, { data: load }] = await Promise.all([
    q.order("is_active", { ascending: false }).order("name", { ascending: true }).returns<Omit<CourierRow, "token">[]>(),
    db
      .from("deliveries")
      .select("courier_id, state, cash_collected, settlement_id")
      .eq("store_id", storeId)
      .not("courier_id", "is", null)
      .returns<Pick<DeliveryRow, "courier_id" | "state" | "cash_collected" | "settlement_id">[]>(),
  ]);
  if (error) throw error;
  return (couriers ?? []).map((c) => {
    const mine = (load ?? []).filter((d) => d.courier_id === c.id);
    return {
      ...(c as CourierRow),
      token: "",
      open_stops: mine.filter((d) => d.state === "assigned" || d.state === "out_for_delivery").length,
      cash_held: mine.filter((d) => d.settlement_id === null).reduce((sum, d) => sum + (d.cash_collected ?? 0), 0),
    };
  });
}

/** The only read that returns the private link. */
export async function getCourier(storeId: string, id: string): Promise<CourierRow | null> {
  const db = createSupabaseAdminClient();
  const { data } = await db.from("couriers").select("*").eq("store_id", storeId).eq("id", id).maybeSingle<CourierRow>();
  return data ?? null;
}

export async function getDeliveryKpis(storeId: string, timezone: string): Promise<DeliveryKpis> {
  const db = createSupabaseAdminClient();
  const today = storeToday(timezone);
  const [out, scheduled, delivered, failed, unverified, cash] = await Promise.all([
    db.from("deliveries").select("id", { count: "exact", head: true }).eq("store_id", storeId).eq("state", "out_for_delivery"),
    db.from("deliveries").select("id", { count: "exact", head: true }).eq("store_id", storeId).eq("scheduled_for", today).in("state", ["pending", "assigned", "out_for_delivery"]),
    db.from("deliveries").select("id", { count: "exact", head: true }).eq("store_id", storeId).eq("state", "delivered").gte("completed_at", `${today}T00:00:00`),
    db.from("deliveries").select("id", { count: "exact", head: true }).eq("store_id", storeId).eq("state", "failed").gte("completed_at", `${today}T00:00:00`),
    db.from("deliveries").select("id", { count: "exact", head: true }).eq("store_id", storeId).eq("state", "delivered").eq("verified", false),
    db.from("deliveries").select("cash_collected").eq("store_id", storeId).is("settlement_id", null).not("cash_collected", "is", null).returns<{ cash_collected: number }[]>(),
  ]);
  return {
    outForDelivery: out.count ?? 0,
    scheduledToday: scheduled.count ?? 0,
    deliveredToday: delivered.count ?? 0,
    failedToday: failed.count ?? 0,
    unverified: unverified.count ?? 0,
    cashOutstanding: (cash.data ?? []).reduce((s, r) => s + (r.cash_collected ?? 0), 0),
  };
}

/** Everything the order detail page needs: the current job and every earlier attempt, with events. */
export async function listDeliveriesForOrder(storeId: string, orderId: string): Promise<(DeliveryRow & { courier_name: string | null; events: DeliveryEventRow[] })[]> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("deliveries")
    .select("*, couriers(name), delivery_events(*)")
    .eq("store_id", storeId)
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .returns<(DeliveryRow & { couriers: { name: string } | null; delivery_events: DeliveryEventRow[] })[]>();
  return (data ?? []).map((d) => ({
    ...d,
    courier_name: d.couriers?.name ?? null,
    events: [...(d.delivery_events ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }));
}

export type DeliveryLogRow = DeliveryEventRow & { order_number: string | null; order_id: string | null; courier_name: string | null; actor_name: string | null };

export async function listDeliveryEvents(storeId: string, params: ListParams<"created_at">): Promise<{ rows: DeliveryLogRow[]; total: number }> {
  const db = createSupabaseAdminClient();
  const { data, error, count } = await db
    .from("delivery_events")
    .select("*, profiles(full_name), couriers(name), deliveries(order_id, orders(number))", { count: "exact" })
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .range(params.range.from, params.range.to)
    .returns<(DeliveryEventRow & { profiles: { full_name: string | null } | null; couriers: { name: string } | null; deliveries: { order_id: string; orders: { number: string } | null } | null })[]>();
  if (error) throw error;
  return {
    rows: (data ?? []).map((e) => ({
      ...e,
      order_id: e.deliveries?.order_id ?? null,
      order_number: e.deliveries?.orders?.number ?? null,
      courier_name: e.couriers?.name ?? null,
      actor_name: e.profiles?.full_name ?? null,
    })),
    total: count ?? 0,
  };
}

export interface CashSheetGroup {
  courier: CourierWithLoad;
  rows: DeliveryListRow[];
  expected: number;
  collected: number;
}

/** Cash a courier is still holding: delivered stops with money on them and no settlement yet. */
export async function listCashSheet(storeId: string): Promise<CashSheetGroup[]> {
  const db = createSupabaseAdminClient();
  const [{ data }, couriers] = await Promise.all([
    db
      .from("deliveries")
      .select(DELIVERY_SELECT)
      .eq("store_id", storeId)
      .eq("state", "delivered")
      .is("settlement_id", null)
      .gt("cash_expected", 0)
      .order("completed_at", { ascending: true })
      .returns<JoinedDelivery[]>(),
    listCouriers(storeId),
  ]);
  const byCourier = new Map<string, DeliveryListRow[]>();
  for (const row of (data ?? []).map(flatten)) {
    if (!row.courier_id) continue;
    byCourier.set(row.courier_id, [...(byCourier.get(row.courier_id) ?? []), row]);
  }
  return couriers
    .filter((c) => byCourier.has(c.id))
    .map((courier) => {
      const rows = byCourier.get(courier.id) ?? [];
      return {
        courier,
        rows,
        expected: rows.reduce((s, r) => s + r.cash_expected, 0),
        collected: rows.reduce((s, r) => s + (r.cash_collected ?? 0), 0),
      };
    });
}

export async function listSettlements(storeId: string, limit = 20): Promise<(DeliverySettlementRow & { courier_name: string | null })[]> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("delivery_settlements")
    .select("*, couriers(name)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<(DeliverySettlementRow & { couriers: { name: string } | null })[]>();
  return (data ?? []).map((s) => ({ ...s, courier_name: s.couriers?.name ?? null }));
}

export interface CourierStat {
  courier_id: string;
  name: string;
  stops: number;
  delivered: number;
  failed: number;
  verified: number;
  cash: number;
}

export interface DeliveryStats {
  /** Zero-filled day spine, oldest first. */
  days: { day: string; delivered: number; failed: number }[];
  delivered: number;
  failed: number;
  verified: number;
  /** Average hours from `shipped_at` to delivery, or null when nothing is comparable. */
  avgHours: number | null;
  couriers: CourierStat[];
}

/** Analytics over a window. Reduced in JS like `getDashboard`, over a single date-bounded read. */
export async function getDeliveryStats(storeId: string, timezone: string, days = 30): Promise<DeliveryStats> {
  const db = createSupabaseAdminClient();
  const since = storeToday(timezone, -(days - 1));
  const { data } = await db
    .from("deliveries")
    .select("courier_id, state, verified, cash_collected, completed_at, created_at, orders(shipped_at), couriers(name)")
    .eq("store_id", storeId)
    .gte("created_at", `${since}T00:00:00`)
    .returns<(Pick<DeliveryRow, "courier_id" | "state" | "verified" | "cash_collected" | "completed_at" | "created_at"> & { orders: { shipped_at: string | null } | null; couriers: { name: string } | null })[]>();
  const rows = data ?? [];

  // Zero-filled spine: a chart is a time axis, not a sparse list (same reason as getDashboard).
  const spine: { day: string; delivered: number; failed: number }[] = [];
  for (let i = days - 1; i >= 0; i--) spine.push({ day: storeToday(timezone, -i), delivered: 0, failed: 0 });
  const byDay = new Map(spine.map((d) => [d.day, d]));
  const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

  const byCourier = new Map<string, CourierStat>();
  let hoursSum = 0;
  let hoursCount = 0;

  for (const r of rows) {
    if (r.completed_at) {
      const bucket = byDay.get(dayKey(r.completed_at));
      if (bucket) {
        if (r.state === "delivered") bucket.delivered++;
        if (r.state === "failed") bucket.failed++;
      }
    }
    if (r.state === "delivered" && r.completed_at && r.orders?.shipped_at) {
      hoursSum += (new Date(r.completed_at).getTime() - new Date(r.orders.shipped_at).getTime()) / 3_600_000;
      hoursCount++;
    }
    if (r.courier_id) {
      const stat = byCourier.get(r.courier_id) ?? { courier_id: r.courier_id, name: r.couriers?.name ?? "—", stops: 0, delivered: 0, failed: 0, verified: 0, cash: 0 };
      stat.stops++;
      if (r.state === "delivered") stat.delivered++;
      if (r.state === "failed") stat.failed++;
      if (r.state === "delivered" && r.verified) stat.verified++;
      stat.cash += r.cash_collected ?? 0;
      byCourier.set(r.courier_id, stat);
    }
  }

  return {
    days: spine,
    delivered: rows.filter((r) => r.state === "delivered").length,
    failed: rows.filter((r) => r.state === "failed").length,
    verified: rows.filter((r) => r.state === "delivered" && r.verified).length,
    avgHours: hoursCount > 0 ? hoursSum / hoursCount : null,
    couriers: [...byCourier.values()].sort((a, b) => b.delivered - a.delivered),
  };
}

export interface LookupMatch {
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  customerName: string | null;
  phone: string | null;
  address: string | null;
  total: number;
  currency: string;
  deliveryId: string | null;
  deliveryState: DeliveryState | null;
  courierName: string | null;
  cashExpected: number;
  cashCollected: number | null;
  /** The query WAS this order's delivery code — so the code is already proven. */
  matchedByCode: boolean;
  /** Wrong-code tries left; 0 means the code is locked. */
  triesLeft: number;
  /** Shipped with an open stop: one click away from delivered. */
  canConfirm: boolean;
}

/**
 * One box for the whole module: six digits, an order number, a phone or a name.
 *
 * A delivery code is an identifier, so it should be the thing you search WITH. When the query is the
 * code and it matches, the searcher has already proved it — the caller can then close the stop in a
 * single click instead of re-typing it into a dialog.
 */
export async function lookupDelivery(storeId: string, query: string, attemptLimit: number): Promise<LookupMatch[]> {
  const term = query.trim();
  if (term.length < 3) return [];
  const db = createSupabaseAdminClient();
  const isCode = /^[0-9]{6}$/.test(term);
  // Strip what would break a PostgREST or() filter.
  const safe = term.replace(/[,()%\\]/g, " ").trim();

  let q = db
    .from("orders")
    .select(
      "id, number, status, total, currency, phone, delivery_code, delivery_attempts, shipping_address, customers(full_name), deliveries(id, state, cash_expected, cash_collected, couriers(name))",
    )
    .eq("store_id", storeId)
    .limit(10);
  // The phone can live on the order or only in the address snapshot, depending on how it was placed.
  q = isCode
    ? q.or(`delivery_code.eq.${safe},number.ilike.%${safe}%`)
    : q.or(`number.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%,shipping_address->>phone.ilike.%${safe}%`);

  const { data } = await q.returns<
    {
      id: string;
      number: string;
      status: OrderStatus;
      total: number;
      currency: string;
      phone: string | null;
      delivery_code: string;
      delivery_attempts: number;
      shipping_address: OrderAddress | null;
      customers: { full_name: string | null } | null;
      deliveries: { id: string; state: DeliveryState; cash_expected: number; cash_collected: number | null; couriers: { name: string } | null }[];
    }[]
  >();

  return (data ?? []).map((o) => {
    const open = o.deliveries?.find((d) => d.state === "assigned" || d.state === "out_for_delivery" || d.state === "pending");
    const latest = open ?? o.deliveries?.[o.deliveries.length - 1] ?? null;
    const a = o.shipping_address;
    const matchedByCode = isCode && o.delivery_code === safe;
    const triesLeft = Math.max(0, attemptLimit - o.delivery_attempts);
    return {
      orderId: o.id,
      orderNumber: o.number,
      orderStatus: o.status,
      customerName: o.customers?.full_name ?? a?.full_name ?? null,
      phone: a?.phone ?? o.phone,
      address: a ? [a.line1, a.city].filter(Boolean).join(", ") : null,
      total: o.total,
      currency: o.currency,
      deliveryId: latest?.id ?? null,
      deliveryState: latest?.state ?? null,
      courierName: latest?.couriers?.name ?? null,
      cashExpected: latest?.cash_expected ?? 0,
      cashCollected: latest?.cash_collected ?? null,
      matchedByCode,
      triesLeft,
      canConfirm: o.status === "shipped" && triesLeft > 0,
    };
  });
}
