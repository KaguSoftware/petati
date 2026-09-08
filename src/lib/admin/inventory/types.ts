import type { StockReason } from "@/lib/db/types";

export type StockSort = "stock_qty" | "sku";
export const STOCK_SORTS: readonly StockSort[] = ["stock_qty", "sku"];

/** Reasons an admin may pick when adjusting stock by hand (`initial` and `sale` are system-only). */
export const ADJUST_REASONS = ["purchase", "return", "adjustment", "damaged", "correction"] as const satisfies readonly StockReason[];
export type AdjustReason = (typeof ADJUST_REASONS)[number];

export const ALL_STOCK_REASONS: readonly StockReason[] = ["initial", "purchase", "sale", "return", "adjustment", "damaged", "correction"];

export interface StockRow {
  variantId: string;
  productId: string;
  productName: string;
  /** Option value labels joined, e.g. "Red · L"; empty for single-variant products. */
  variantLabel: string;
  sku: string | null;
  stock_qty: number;
  track_inventory: boolean;
  allow_backorder: boolean;
  is_active: boolean;
  threshold: number;
  level: "ok" | "low" | "out";
}

export interface MovementRow {
  id: string;
  created_at: string;
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  sku: string | null;
  delta: number;
  reason: StockReason;
  actorName: string | null;
  orderId: string | null;
  orderNumber: string | null;
  note: string | null;
}
