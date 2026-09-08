"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { adminMutation, actionError } from "@/lib/admin/guard";
import type { ActionState } from "@/lib/admin/types";
import { boolField, intField, moneyField, optionalDateField, optionalIntField, optionalMoneyField, parseForm, uuidField } from "@/lib/admin/validate";
import type { DiscountType } from "@/lib/db/types";
import { DISCOUNT_TYPES } from "./types";

const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC = "٠١٢٣٤٥٦٧٨٩";

/** Persian / Arabic-Indic digits typed into numeric fields → ASCII, so `Number()` parses them. */
const latinDigits = (v: unknown) =>
  typeof v === "string" ? v.replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d))).replace(/[٠-٩]/g, (d) => String(ARABIC.indexOf(d))) : v;

const CODE_RE = /^[A-Z0-9_-]{3,30}$/;

const base = z.object({
  storeId: uuidField,
  couponId: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), uuidField.optional()),
  code: z.preprocess((v) => (typeof v === "string" ? v.trim().toUpperCase() : v), z.string().regex(CODE_RE, "codeFormat")),
  type: z.enum(DISCOUNT_TYPES as [DiscountType, ...DiscountType[]]),
  max_uses: z.preprocess(latinDigits, optionalIntField({ min: 1 })),
  max_uses_per_customer: z.preprocess(latinDigits, optionalIntField({ min: 1 })),
  starts_at: optionalDateField,
  ends_at: optionalDateField,
  is_active: boolField,
});

type Db = Awaited<ReturnType<typeof adminMutation>>["db"];

async function storeCurrency(db: Db, storeId: string) {
  const { data } = await db.from("stores").select("currency").eq("id", storeId).maybeSingle<{ currency: string }>();
  return data?.currency ?? "TRY";
}

/** Create (no couponId) or update a coupon. Code is uppercased and unique per store. */
export async function saveCouponAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(base, formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, couponId, code, type, max_uses, max_uses_per_customer, starts_at, ends_at, is_active } = parsed.data;
  try {
    const { db } = await adminMutation(storeId, "coupons.manage");
    const currency = await storeCurrency(db, storeId);

    // value + min_subtotal depend on the store currency and the discount type
    const money = parseForm(
      z.object({
        min_subtotal: z.preprocess(latinDigits, optionalMoneyField(currency, { min: 1 })),
        value:
          type === "percent"
            ? z.preprocess(latinDigits, intField({ min: 1, max: 100 }))
            : type === "fixed"
              ? z.preprocess(latinDigits, moneyField(currency, { min: 1 }))
              : z.preprocess(() => 0, z.number()),
      }),
      formData,
    );
    if (!money.data) {
      const fieldErrors = { ...money.fieldErrors };
      if (fieldErrors.value && type === "percent") fieldErrors.value = "percentRange";
      return { error: "invalid", fieldErrors };
    }
    if (starts_at && ends_at && ends_at < starts_at) return { error: "invalid", fieldErrors: { ends_at: "dateOrder" } };

    // SCOPE(coupons): validity window is stored as whole UTC days. GROWS LATER → store-timezone boundaries.
    const row = {
      store_id: storeId,
      code,
      type,
      value: money.data.value,
      min_subtotal: money.data.min_subtotal,
      max_uses,
      max_uses_per_customer,
      starts_at: starts_at ? `${starts_at}T00:00:00.000Z` : null,
      ends_at: ends_at ? `${ends_at}T23:59:59.999Z` : null,
      is_active,
    };

    const query = couponId
      ? db.from("coupons").update(row).eq("store_id", storeId).eq("id", couponId).select("id").maybeSingle<{ id: string }>()
      : db.from("coupons").insert(row).select("id").maybeSingle<{ id: string }>();
    const { data, error } = await query;
    if (error) {
      if (error.code === "23505") return { error: "invalid", fieldErrors: { code: "unique" } };
      throw error;
    }
    if (!data) return { error: "notFound" };
    refresh();
    return { ok: true, id: data.id };
  } catch (err) {
    return { error: actionError(err) };
  }
}

const toggleSchema = z.object({ storeId: uuidField, couponId: uuidField, is_active: boolField });

export async function toggleCouponAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(toggleSchema, formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, couponId, is_active } = parsed.data;
  try {
    const { db } = await adminMutation(storeId, "coupons.manage");
    const { data, error } = await db.from("coupons").update({ is_active }).eq("store_id", storeId).eq("id", couponId).select("id").maybeSingle<{ id: string }>();
    if (error) throw error;
    if (!data) return { error: "notFound" };
    refresh();
    return { ok: true, id: data.id };
  } catch (err) {
    return { error: actionError(err) };
  }
}

const deleteSchema = z.object({ storeId: uuidField, couponId: uuidField });

/** Only unused coupons can be deleted; redeemed ones must be deactivated to keep order history intact. */
export async function deleteCouponAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(deleteSchema, formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, couponId } = parsed.data;
  try {
    const { db } = await adminMutation(storeId, "coupons.manage");
    const { data: coupon } = await db.from("coupons").select("id, uses_count").eq("store_id", storeId).eq("id", couponId).maybeSingle<{ id: string; uses_count: number }>();
    if (!coupon) return { error: "notFound" };
    if (coupon.uses_count > 0) return { error: "hasUses" };
    const { count } = await db.from("coupon_redemptions").select("id", { count: "exact", head: true }).eq("coupon_id", couponId);
    if ((count ?? 0) > 0) return { error: "hasUses" };
    const { error } = await db.from("coupons").delete().eq("store_id", storeId).eq("id", couponId);
    if (error) throw error;
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}
