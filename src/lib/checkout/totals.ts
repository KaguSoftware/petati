import type { CouponRow, ShippingRateRow } from "@/lib/db/types";
import type { CartSummary } from "@/lib/cart/cart";

export interface Totals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  freeShippingApplied: boolean;
}

/**
 * Single source of truth for order maths (used by cart page, checkout and order creation).
 * All amounts are minor units. Tax is computed on (subtotal - discount + shipping) using the store's
 * basis-point rate; when prices include tax the tax is extracted rather than added.
 */
export function computeTotals(
  cart: Pick<CartSummary, "subtotal" | "coupon">,
  rate: ShippingRateRow | null,
  store: { tax_rate_bp: number; prices_include_tax: boolean },
): Totals {
  const subtotal = cart.subtotal;
  const coupon = cart.coupon && couponApplies(cart.coupon, subtotal) ? cart.coupon : null;

  let discount = 0;
  if (coupon?.type === "percent") discount = Math.round((subtotal * coupon.value) / 100);
  if (coupon?.type === "fixed") discount = Math.min(coupon.value, subtotal);

  let shipping = 0;
  let freeShippingApplied = false;
  if (rate) {
    shipping = rate.rate;
    if (rate.free_over !== null && subtotal >= rate.free_over) {
      shipping = 0;
      freeShippingApplied = true;
    }
  }
  if (coupon?.type === "free_shipping" && shipping > 0) {
    shipping = 0;
    freeShippingApplied = true;
  }

  const taxable = subtotal - discount + shipping;
  let tax = 0;
  let total = taxable;
  if (store.tax_rate_bp > 0) {
    if (store.prices_include_tax) {
      tax = Math.round(taxable - taxable / (1 + store.tax_rate_bp / 10_000));
    } else {
      tax = Math.round((taxable * store.tax_rate_bp) / 10_000);
      total = taxable + tax;
    }
  }
  return { subtotal, discount, shipping, tax, total, freeShippingApplied };
}

export function couponApplies(c: CouponRow, subtotal: number): boolean {
  if (c.min_subtotal !== null && subtotal < c.min_subtotal) return false;
  return true;
}
