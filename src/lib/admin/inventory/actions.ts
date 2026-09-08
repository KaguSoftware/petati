"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { actionError, adminMutation, assertVariantInStore } from "@/lib/admin/guard";
import type { ActionState } from "@/lib/admin/types";
import { boolField, intField, optionalText, parseForm, uuidField } from "@/lib/admin/validate";
import { catalogTag } from "@/lib/catalog/queries";
import { ADJUST_REASONS } from "./types";

const adjustSchema = z.object({
  storeId: uuidField,
  variantId: uuidField,
  mode: z.enum(["delta", "set"]),
  quantity: intField({ min: -1_000_000, max: 1_000_000 }),
  reason: z.enum(ADJUST_REASONS),
  note: optionalText(300),
});

/**
 * Records a stock movement; the `apply_stock_movement` trigger updates `product_variants.stock_qty`.
 * "set" re-reads the live quantity so concurrent sales are not overwritten.
 */
export async function adjustStockAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(adjustSchema, formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, variantId, mode, quantity, reason, note } = parsed.data;
  try {
    const { db, user } = await adminMutation(storeId, "inventory.adjust");
    await assertVariantInStore(db, variantId, storeId);
    let delta = quantity;
    if (mode === "set") {
      if (quantity < 0) return { error: "invalid", fieldErrors: { quantity: "invalid" } };
      const { data } = await db.from("product_variants").select("stock_qty").eq("id", variantId).eq("store_id", storeId).maybeSingle<{ stock_qty: number }>();
      if (!data) return { error: "notFound" };
      delta = quantity - data.stock_qty;
    }
    if (delta === 0) return { error: "invalid", fieldErrors: { quantity: "zeroDelta" } };
    const { error } = await db.from("stock_movements").insert({ store_id: storeId, variant_id: variantId, delta, reason, note, actor_id: user.id });
    if (error) throw error;
    updateTag(catalogTag(storeId));
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}

/** Inventory tracking flags live on the variant and need products.write. */
export async function setTrackingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(z.object({ storeId: uuidField, variantId: uuidField, field: z.enum(["track_inventory", "allow_backorder"]), value: boolField }), formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, variantId, field, value } = parsed.data;
  try {
    const { db } = await adminMutation(storeId, "products.write");
    await assertVariantInStore(db, variantId, storeId);
    const { error } = await db.from("product_variants").update({ [field]: value }).eq("id", variantId).eq("store_id", storeId);
    if (error) throw error;
    updateTag(catalogTag(storeId));
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}
