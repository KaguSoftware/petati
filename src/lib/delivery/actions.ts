"use server";

import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStoreBySlug } from "@/lib/tenant/store";
import type { OrderRow } from "@/lib/db/types";
import { confirmDeliveryWithCode } from "./confirm";

export interface DeliveryFormState {
  ok?: boolean;
  /** Message key under the `deliver` namespace. */
  error?: string;
  /** Echoed back on success so the page can name the order it closed. */
  number?: string;
}

const schema = z.object({
  slug: z.string().min(1).max(120),
  number: z.string().trim().min(3).max(40),
  code: z.string().trim().regex(/^[0-9]{6}$/),
});

/**
 * Delivery confirmation from the parcel itself — no login, so the page is deliberately blind:
 * it needs the order number (printed on the slip) AND the customer's code, it never returns any
 * order content, and an unknown order answers exactly like a wrong code so the form cannot be used
 * to discover which order numbers exist. Five wrong tries lock the order (see confirm.ts).
 */
export async function confirmDeliveryPublicAction(_prev: DeliveryFormState, formData: FormData): Promise<DeliveryFormState> {
  const parsed = schema.safeParse({ slug: formData.get("slug"), number: formData.get("number"), code: formData.get("code") });
  if (!parsed.success) return { error: "invalid" };
  const { slug, number, code } = parsed.data;

  const store = await getStoreBySlug(slug);
  if (!store || !store.is_active) return { error: "invalid" };

  const db = createSupabaseAdminClient();
  const { data: order } = await db
    .from("orders")
    .select("*")
    .eq("store_id", store.id)
    .eq("number", number.toUpperCase())
    .maybeSingle<OrderRow>();
  if (!order) return { error: "invalid" };

  const result = await confirmDeliveryWithCode(db, order, code, null);
  if (result === "ok") return { ok: true, number: order.number };
  // "wrongCode" and an unknown order must read the same to the visitor.
  if (result === "locked") return { error: "locked" };
  if (result === "transition") return { error: "notShipped" };
  return { error: "invalid" };
}
