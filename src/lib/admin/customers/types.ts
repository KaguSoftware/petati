import type { AddressRow, CustomerRow } from "@/lib/db/types";

/** Row of `public.v_customer_stats` (customers + order aggregates). */
export interface CustomerStatsRow extends CustomerRow {
  updated_at: string;
  /** Orders that are not cancelled. */
  orders_count: number;
  /** Sum of `total` for paid → delivered orders, minor units. */
  total_spent: number;
  last_order_at: string | null;
}

export interface CustomerDetail extends CustomerStatsRow {
  addresses: AddressRow[];
}

export type CustomerSort = "created_at" | "total_spent" | "orders_count";
export const CUSTOMER_SORTS: readonly CustomerSort[] = ["created_at", "total_spent", "orders_count"];

export type MarketingFilter = "yes" | "no";
export const MARKETING_FILTERS: readonly MarketingFilter[] = ["yes", "no"];
