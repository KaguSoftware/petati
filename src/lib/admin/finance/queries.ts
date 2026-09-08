import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { stringParam, type ListParams, type SearchParams } from "@/lib/admin/list-params";
import type { ExpenseCategoryRow } from "@/lib/db/types";
import type { DailySalesRow, DateRange, ExpenseListRow, ExpenseSort, ExpenseTotals, ProductMarginRow, SalesSummary } from "./types";

const num = (v: unknown) => Number(v ?? 0) || 0;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function localIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * `from` / `to` from the URL, defaulting to the last 30 days. Uses `new Date()`, so call it only
 * after a runtime read (searchParams / cookies) inside a Suspense boundary.
 */
export function resolveDateRange(sp: SearchParams, days = 30): DateRange {
  const rawFrom = stringParam(sp, "from", 10);
  const rawTo = stringParam(sp, "to", 10);
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));
  const to = rawTo && ISO_DATE.test(rawTo) ? rawTo : localIso(today);
  const from = rawFrom && ISO_DATE.test(rawFrom) ? rawFrom : localIso(start);
  return from <= to ? { from, to } : { from: to, to: from };
}

/** Daily sales in the period plus totals. Rows are merged per day (the view also groups by currency). */
export async function getSalesSummary(storeId: string, from: string, to: string): Promise<SalesSummary> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("v_daily_sales")
    .select("day, orders_count, subtotal, discounts, shipping, tax, gross, paid_gross, refunds, cogs")
    .eq("store_id", storeId)
    .gte("day", from)
    .lte("day", to)
    .order("day")
    .returns<Record<string, unknown>[]>();
  if (error) throw error;

  const byDay = new Map<string, DailySalesRow>();
  for (const r of data ?? []) {
    const day = String(r.day);
    const cur = byDay.get(day) ?? { day, orders_count: 0, subtotal: 0, discounts: 0, shipping: 0, tax: 0, gross: 0, paid_gross: 0, refunds: 0, cogs: 0 };
    cur.orders_count += num(r.orders_count);
    cur.subtotal += num(r.subtotal);
    cur.discounts += num(r.discounts);
    cur.shipping += num(r.shipping);
    cur.tax += num(r.tax);
    cur.gross += num(r.gross);
    cur.paid_gross += num(r.paid_gross);
    cur.refunds += num(r.refunds);
    cur.cogs += num(r.cogs);
    byDay.set(day, cur);
  }
  const rows = [...byDay.values()];
  const totals = rows.reduce(
    (a, d) => ({
      orders: a.orders + d.orders_count,
      gross: a.gross + d.gross,
      paidGross: a.paidGross + d.paid_gross,
      refunds: a.refunds + d.refunds,
      cogs: a.cogs + d.cogs,
      discounts: a.discounts + d.discounts,
      shipping: a.shipping + d.shipping,
      tax: a.tax + d.tax,
    }),
    { orders: 0, gross: 0, paidGross: 0, refunds: 0, cogs: 0, discounts: 0, shipping: 0, tax: 0 },
  );
  return { rows, totals };
}

/** Expense totals per category in the period. SCOPE(finance): aggregated in JS; GROWS LATER → SQL aggregate for large stores. */
export async function getExpenseTotals(storeId: string, from: string, to: string): Promise<ExpenseTotals> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("expenses")
    .select("category_id, amount, expense_categories(name, sort_order)")
    .eq("store_id", storeId)
    .gte("spent_on", from)
    .lte("spent_on", to)
    .returns<{ category_id: string | null; amount: number; expense_categories: { name: string; sort_order: number } | null }[]>();
  if (error) throw error;

  const groups = new Map<string, { category_id: string | null; name: string | null; sort: number; total: number; count: number }>();
  for (const r of data ?? []) {
    const key = r.category_id ?? "";
    const cur = groups.get(key) ?? {
      category_id: r.category_id,
      name: r.expense_categories?.name ?? null,
      sort: r.expense_categories?.sort_order ?? Number.MAX_SAFE_INTEGER,
      total: 0,
      count: 0,
    };
    cur.total += num(r.amount);
    cur.count += 1;
    groups.set(key, cur);
  }
  const rows = [...groups.values()]
    .sort((a, b) => b.total - a.total || a.sort - b.sort)
    .map(({ category_id, name, total, count }) => ({ category_id, name, total, count }));
  return { rows, total: rows.reduce((a, r) => a + r.total, 0) };
}

/**
 * Best-margin products. SCOPE(finance): `v_product_margins` is all-time (no date column), so the
 * overview's date range does not apply here. GROWS LATER → view keyed by day, or an RPC taking from/to.
 */
export async function getProductMargins(storeId: string, { limit = 20 }: { limit?: number } = {}): Promise<ProductMarginRow[]> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("v_product_margins")
    .select("product_id, variant_id, product_name, sku, units_sold, revenue, cogs, gross_margin")
    .eq("store_id", storeId)
    .order("gross_margin", { ascending: false })
    .limit(limit)
    .returns<Record<string, unknown>[]>();
  if (error) throw error;
  return (data ?? []).map((r) => ({
    product_id: (r.product_id as string | null) ?? null,
    variant_id: (r.variant_id as string | null) ?? null,
    product_name: String(r.product_name ?? ""),
    sku: (r.sku as string | null) ?? null,
    units_sold: num(r.units_sold),
    revenue: num(r.revenue),
    cogs: num(r.cogs),
    gross_margin: num(r.gross_margin),
  }));
}

export interface ExpenseListFilters {
  from?: string;
  to?: string;
  /** Category id, or "none" for uncategorised. */
  categoryId?: string;
}

/** Strip characters that would break a PostgREST `or()` filter. */
function safeLike(q: string) {
  return q.replace(/[,()%\\]/g, " ").trim();
}

export async function listExpenses(storeId: string, params: ListParams<ExpenseSort> & ExpenseListFilters): Promise<{ rows: ExpenseListRow[]; total: number }> {
  const db = createSupabaseAdminClient();
  let q = db
    .from("expenses")
    .select("id, category_id, amount, currency, spent_on, vendor, note, receipt_url, created_at, expense_categories(name)", { count: "exact" })
    .eq("store_id", storeId);
  if (params.from) q = q.gte("spent_on", params.from);
  if (params.to) q = q.lte("spent_on", params.to);
  if (params.categoryId === "none") q = q.is("category_id", null);
  else if (params.categoryId) q = q.eq("category_id", params.categoryId);
  const term = safeLike(params.q);
  if (term) q = q.or(`vendor.ilike.%${term}%,note.ilike.%${term}%`);
  const { data, count, error } = await q
    .order(params.sort, { ascending: params.dir === "asc" })
    .order("created_at", { ascending: false })
    .range(params.range.from, params.range.to);
  if (error) throw error;
  type Raw = Omit<ExpenseListRow, "category_name"> & { expense_categories: { name: string } | null };
  const rows = ((data ?? []) as unknown as Raw[]).map(({ expense_categories, ...r }) => ({ ...r, amount: num(r.amount), category_name: expense_categories?.name ?? null }));
  return { rows, total: count ?? 0 };
}

export async function listExpenseCategories(storeId: string): Promise<ExpenseCategoryRow[]> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("expense_categories")
    .select("id, store_id, name, sort_order")
    .eq("store_id", storeId)
    .order("sort_order")
    .order("name")
    .returns<ExpenseCategoryRow[]>();
  if (error) throw error;
  return data ?? [];
}
