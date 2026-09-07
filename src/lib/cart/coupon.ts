import type { CouponRow } from "@/lib/db/types";

/** Time/usage validity of a coupon (amount rules live in checkout/totals.ts). */
export function couponIsLive(c: CouponRow, now = new Date()): boolean {
  if (!c.is_active) return false;
  if (c.starts_at && new Date(c.starts_at) > now) return false;
  if (c.ends_at && new Date(c.ends_at) < now) return false;
  if (c.max_uses !== null && c.uses_count >= c.max_uses) return false;
  return true;
}
