import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/i18n/config";
import { pickTranslation } from "@/lib/catalog/types";
import type { DeliveryState, OrderStatus } from "@/lib/db/types";
import { getDeliveryKpis, listTodayRuns, listUndeliveredOrders, storeToday, type TodayRun } from "@/lib/admin/delivery/queries";
import type { DeliveryKpis } from "@/lib/admin/delivery/types";

export interface DailySales {
  day: string;
  orders_count: number;
  gross: number;
  paid_gross: number;
  refunds: number;
  cogs: number;
}

export interface Dashboard {
  currency: string;
  /** Null when the caller lacks finance.read. */
  sales: { days: DailySales[]; paidGross: number; refunds: number; cogs: number; ordersCount: number } | null;
  pendingPayment: number;
  pendingReviews: number;
  lowStockCount: number;
  recentOrders: { id: string; number: string; email: string; status: OrderStatus; total: number; currency: string; placed_at: string; delivery: { state: DeliveryState; courier_name: string | null } | null }[];
  lowStock: { variant_id: string; product_id: string; name: string; sku: string | null; stock_qty: number; threshold: number }[];
  /** Null when the caller lacks delivery.read. */
  delivery: { kpis: DeliveryKpis; needsCourier: number; runs: TodayRun[]; today: string } | null;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function getDashboard(storeId: string, opts: { currency: string; locale: Locale; fallback: Locale; finance: boolean; delivery: boolean; timezone: string; days?: number }): Promise<Dashboard> {
  const db = createSupabaseAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - ((opts.days ?? 30) - 1));
  const today = storeToday(opts.timezone);

  type RecentRaw = Omit<Dashboard["recentOrders"][number], "delivery"> & { deliveries: { state: DeliveryState; couriers: { name: string } | null }[] | null };
  const [sales, pending, reviews, low, recent, lowRows, kpis, needs, runs] = await Promise.all([
    opts.finance
      ? db.from("v_daily_sales").select("day, orders_count, gross, paid_gross, refunds, cogs").eq("store_id", storeId).gte("day", isoDate(since)).order("day").returns<DailySales[]>()
      : Promise.resolve({ data: null }),
    db.from("orders").select("id", { count: "exact", head: true }).eq("store_id", storeId).eq("status", "pending_payment"),
    db.from("reviews").select("id", { count: "exact", head: true }).eq("store_id", storeId).eq("status", "pending"),
    db.from("v_low_stock").select("variant_id", { count: "exact", head: true }).eq("store_id", storeId),
    db
      .from("orders")
      .select("id, number, email, status, total, currency, placed_at, deliveries(state, couriers(name))")
      .eq("store_id", storeId)
      .order("placed_at", { ascending: false })
      .order("created_at", { referencedTable: "deliveries", ascending: false })
      .limit(1, { referencedTable: "deliveries" })
      .limit(5)
      .returns<RecentRaw[]>(),
    db.from("v_low_stock").select("variant_id, product_id, sku, stock_qty, low_stock_threshold").eq("store_id", storeId).order("stock_qty").limit(5).returns<{ variant_id: string; product_id: string; sku: string | null; stock_qty: number; low_stock_threshold: number }[]>(),
    opts.delivery ? getDeliveryKpis(storeId, opts.timezone) : Promise.resolve(null),
    opts.delivery ? listUndeliveredOrders(storeId, 100) : Promise.resolve([]),
    opts.delivery ? listTodayRuns(storeId, today) : Promise.resolve([]),
  ]);

  const productIds = [...new Set((lowRows.data ?? []).map((r) => r.product_id))];
  const names = new Map<string, string>();
  if (productIds.length) {
    const { data } = await db.from("product_translations").select("product_id, locale, name").in("product_id", productIds).returns<{ product_id: string; locale: Locale; name: string }[]>();
    for (const pid of productIds) {
      const rows = (data ?? []).filter((r) => r.product_id === pid);
      names.set(pid, pickTranslation(rows, opts.locale, opts.fallback)?.name ?? "");
    }
  }

  // Zero-fill every day of the window so the chart is a time axis, not a list of days with sales.
  const byDay = new Map((sales.data ?? []).map((d) => [String(d.day).slice(0, 10), d]));
  const span = opts.days ?? 30;
  const days: DailySales[] = Array.from({ length: span }, (_, i) => {
    const date = new Date(since);
    date.setDate(since.getDate() + i);
    const day = isoDate(date);
    const d = byDay.get(day);
    return { day, orders_count: Number(d?.orders_count ?? 0), gross: Number(d?.gross ?? 0), paid_gross: Number(d?.paid_gross ?? 0), refunds: Number(d?.refunds ?? 0), cogs: Number(d?.cogs ?? 0) };
  });
  return {
    currency: opts.currency,
    sales: opts.finance
      ? {
          days,
          paidGross: days.reduce((a, d) => a + d.paid_gross, 0),
          refunds: days.reduce((a, d) => a + d.refunds, 0),
          cogs: days.reduce((a, d) => a + d.cogs, 0),
          ordersCount: days.reduce((a, d) => a + d.orders_count, 0),
        }
      : null,
    pendingPayment: pending.count ?? 0,
    pendingReviews: reviews.count ?? 0,
    lowStockCount: low.count ?? 0,
    recentOrders: (recent.data ?? []).map((o) => {
      const d = o.deliveries?.[0];
      return { id: o.id, number: o.number, email: o.email, status: o.status, total: o.total, currency: o.currency, placed_at: o.placed_at, delivery: d ? { state: d.state, courier_name: d.couriers?.name ?? null } : null };
    }),
    lowStock: (lowRows.data ?? []).map((r) => ({ variant_id: r.variant_id, product_id: r.product_id, name: names.get(r.product_id) ?? r.sku ?? "", sku: r.sku, stock_qty: r.stock_qty, threshold: r.low_stock_threshold })),
    delivery: kpis ? { kpis, needsCourier: needs.length, runs, today } : null,
  };
}
