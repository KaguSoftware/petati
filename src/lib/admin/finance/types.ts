import type { ExpenseCategoryRow } from "@/lib/db/types";

export type { ExpenseCategoryRow };

/** One row of `v_daily_sales`, numbers coerced (PostgREST may return bigint sums as strings). */
export interface DailySalesRow {
  day: string;
  orders_count: number;
  subtotal: number;
  discounts: number;
  shipping: number;
  tax: number;
  gross: number;
  paid_gross: number;
  refunds: number;
  cogs: number;
}

export interface SalesTotals {
  orders: number;
  gross: number;
  paidGross: number;
  refunds: number;
  cogs: number;
  discounts: number;
  shipping: number;
  tax: number;
}

export interface SalesSummary {
  rows: DailySalesRow[];
  totals: SalesTotals;
}

export interface ExpenseCategoryTotal {
  category_id: string | null;
  /** Null for uncategorised expenses. */
  name: string | null;
  total: number;
  count: number;
}

export interface ExpenseTotals {
  rows: ExpenseCategoryTotal[];
  total: number;
}

/** One row of `v_product_margins` (all-time, paid orders only). */
export interface ProductMarginRow {
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  sku: string | null;
  units_sold: number;
  revenue: number;
  cogs: number;
  gross_margin: number;
}

export interface ExpenseListRow {
  id: string;
  category_id: string | null;
  category_name: string | null;
  amount: number;
  currency: string;
  spent_on: string;
  vendor: string | null;
  note: string | null;
  receipt_url: string | null;
  created_at: string;
}

export type ExpenseSort = "spent_on" | "amount" | "created_at";
export const EXPENSE_SORTS: readonly ExpenseSort[] = ["spent_on", "amount", "created_at"];

/** Inclusive ISO date range (YYYY-MM-DD). */
export interface DateRange {
  from: string;
  to: string;
}
