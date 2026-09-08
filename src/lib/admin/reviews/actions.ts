"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { adminMutation, actionError } from "@/lib/admin/guard";
import type { ActionState } from "@/lib/admin/types";
import { parseForm, uuidField } from "@/lib/admin/validate";
import { catalogTag } from "@/lib/catalog/queries";

const base = z.object({ storeId: uuidField, reviewId: uuidField });

type Db = Awaited<ReturnType<typeof adminMutation>>["db"];

async function loadReview(db: Db, storeId: string, reviewId: string) {
  const { data } = await db.from("reviews").select("id, product_id").eq("store_id", storeId).eq("id", reviewId).maybeSingle<{ id: string; product_id: string }>();
  return data ?? null;
}

/** Approved reviews and the product rating (trigger) are cached on the storefront: expire both tags. */
function invalidate(storeId: string, productId: string) {
  updateTag(`reviews:${productId}`);
  updateTag(catalogTag(storeId));
}

export async function moderateReviewAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(base.extend({ status: z.enum(["approved", "rejected"]) }), formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, reviewId, status } = parsed.data;
  try {
    const { db } = await adminMutation(storeId, "reviews.moderate");
    const review = await loadReview(db, storeId, reviewId);
    if (!review) return { error: "notFound" };
    const { error } = await db.from("reviews").update({ status }).eq("store_id", storeId).eq("id", review.id);
    if (error) throw error;
    invalidate(storeId, review.product_id);
    refresh();
    return { ok: true, id: review.id };
  } catch (err) {
    return { error: actionError(err) };
  }
}

export async function deleteReviewAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(base, formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, reviewId } = parsed.data;
  try {
    const { db } = await adminMutation(storeId, "reviews.moderate");
    const review = await loadReview(db, storeId, reviewId);
    if (!review) return { error: "notFound" };
    const { error } = await db.from("reviews").delete().eq("store_id", storeId).eq("id", review.id);
    if (error) throw error;
    invalidate(storeId, review.product_id);
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}
