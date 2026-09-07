"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStoreBySlug } from "@/lib/tenant/store";
import type { CouponRow, ProductVariantRow } from "@/lib/db/types";
import { ensureCart } from "./cart";
import { couponIsLive } from "./coupon";

export interface CartActionState {
  ok?: boolean;
  error?: "invalid" | "out_of_stock" | "coupon_invalid" | "store";
}

const addSchema = z.object({
  storeSlug: z.string().min(1),
  variantId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

async function storeOrFail(slug: string) {
  const store = await getStoreBySlug(slug);
  if (!store || !store.is_active) throw new Error("store");
  return store;
}

export async function addToCartAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const parsed = addSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  const { storeSlug, variantId, quantity } = parsed.data;

  const store = await storeOrFail(storeSlug);
  const db = createSupabaseAdminClient();
  const { data: variant } = await db
    .from("product_variants")
    .select("*")
    .eq("id", variantId)
    .eq("store_id", store.id)
    .eq("is_active", true)
    .maybeSingle<ProductVariantRow>();
  if (!variant) return { error: "invalid" };

  const cart = await ensureCart(store);
  const { data: existing } = await db
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cart.id)
    .eq("variant_id", variantId)
    .maybeSingle<{ id: string; quantity: number }>();
  const nextQty = (existing?.quantity ?? 0) + quantity;

  if (variant.track_inventory && !variant.allow_backorder && nextQty > variant.stock_qty) {
    return { error: "out_of_stock" };
  }

  if (existing) {
    await db.from("cart_items").update({ quantity: nextQty }).eq("id", existing.id);
  } else {
    await db.from("cart_items").insert({ cart_id: cart.id, variant_id: variantId, quantity });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

const qtySchema = z.object({
  storeSlug: z.string().min(1),
  itemId: z.string().uuid(),
  quantity: z.coerce.number().int().min(0).max(99),
});

export async function updateCartItemAction(formData: FormData): Promise<CartActionState> {
  const parsed = qtySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  const { storeSlug, itemId, quantity } = parsed.data;
  const store = await storeOrFail(storeSlug);
  const cart = await ensureCart(store);
  const db = createSupabaseAdminClient();

  if (quantity === 0) {
    await db.from("cart_items").delete().eq("id", itemId).eq("cart_id", cart.id);
  } else {
    const { data: item } = await db
      .from("cart_items")
      .select("variant_id, product_variants(stock_qty, track_inventory, allow_backorder)")
      .eq("id", itemId)
      .eq("cart_id", cart.id)
      .maybeSingle<{
        variant_id: string;
        product_variants: { stock_qty: number; track_inventory: boolean; allow_backorder: boolean };
      }>();
    if (!item) return { error: "invalid" };
    const v = item.product_variants;
    if (v.track_inventory && !v.allow_backorder && quantity > v.stock_qty) return { error: "out_of_stock" };
    await db.from("cart_items").update({ quantity }).eq("id", itemId);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

const couponSchema = z.object({ storeSlug: z.string().min(1), code: z.string().trim().min(1).max(40) });

export async function applyCouponAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const parsed = couponSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  const store = await storeOrFail(parsed.data.storeSlug);
  const cart = await ensureCart(store);
  const db = createSupabaseAdminClient();

  const { data: coupon } = await db
    .from("coupons")
    .select("*")
    .eq("store_id", store.id)
    .eq("code", parsed.data.code)
    .eq("is_active", true)
    .maybeSingle<CouponRow>();
  if (!coupon || !couponIsLive(coupon)) return { error: "coupon_invalid" };

  await db.from("carts").update({ coupon_id: coupon.id }).eq("id", cart.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeCouponAction(formData: FormData) {
  const storeSlug = z.string().parse(formData.get("storeSlug"));
  const store = await storeOrFail(storeSlug);
  const cart = await ensureCart(store);
  await createSupabaseAdminClient().from("carts").update({ coupon_id: null }).eq("id", cart.id);
  revalidatePath("/", "layout");
}
