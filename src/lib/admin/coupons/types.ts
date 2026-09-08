import type { CouponRedemptionRow, CouponRow, DiscountType } from "@/lib/db/types";

export type CouponSort = "created_at" | "code" | "uses_count" | "ends_at";
export const COUPON_SORTS: readonly CouponSort[] = ["created_at", "code", "uses_count", "ends_at"];

export const DISCOUNT_TYPES: readonly DiscountType[] = ["percent", "fixed", "free_shipping"];

/** `admin.status.coupon.*` values. */
export type CouponStatus = "active" | "inactive" | "expired";

/** Derived status; `now` is passed in so callers decide when the clock is read (Cache Components). */
export function couponStatus(c: Pick<CouponRow, "is_active" | "ends_at" | "max_uses" | "uses_count">, now: Date): CouponStatus {
  if (!c.is_active) return "inactive";
  if (c.ends_at && new Date(c.ends_at).getTime() < now.getTime()) return "expired";
  if (c.max_uses != null && c.uses_count >= c.max_uses) return "expired";
  return "active";
}

export interface CouponRedemptionDetail extends CouponRedemptionRow {
  orders: { id: string; number: string; email: string; currency: string } | null;
  customers: { id: string; email: string; full_name: string | null } | null;
}

export interface CouponWithRedemptions extends CouponRow {
  coupon_redemptions: CouponRedemptionDetail[];
}
