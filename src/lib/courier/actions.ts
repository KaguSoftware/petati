"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { DeliveryRow, OrderRow } from "@/lib/db/types";
import { confirmDeliveryWithCode, markDelivered } from "@/lib/delivery/confirm";
import { markShipped } from "@/lib/orders/ship";
import { FAILURE_REASONS } from "@/lib/admin/delivery/types";
import { courierContext } from "./context";
import { uploadProofPhoto } from "./photo";

export interface CourierActionState {
  ok?: boolean;
  /** Message key under the public `courier.errors` namespace. */
  error?: string;
  /** Wrong-code tries left, so the sheet can warn before the code locks. */
  triesLeft?: number;
}

const token = z.string().regex(/^[0-9a-f-]{36}$/i);
const base = z.object({ token, deliveryId: z.string().uuid() });

type Db = ReturnType<typeof createSupabaseAdminClient>;

/** Resolve the token, then the stop — the token is the whole authorisation, so it is re-checked here. */
async function loadStop(tokenValue: string, deliveryId: string) {
  const ctx = await courierContext(tokenValue);
  if (!ctx) return null;
  const db = createSupabaseAdminClient();
  const { data: delivery } = await db
    .from("deliveries")
    .select("*")
    .eq("id", deliveryId)
    .eq("store_id", ctx.store.id)
    .eq("courier_id", ctx.courier.id)
    .maybeSingle<DeliveryRow>();
  if (!delivery) return null;
  return { ctx, db, delivery };
}

async function logCourierEvent(db: Db, storeId: string, deliveryId: string, courierId: string, type: string, data: Record<string, unknown> = {}) {
  await db.from("delivery_events").insert({ store_id: storeId, delivery_id: deliveryId, type, actor_id: null, courier_id: courierId, data });
}

/** One tap at the depot: every assigned stop for today goes out, and its order is marked shipped. */
export async function startRunAction(_prev: CourierActionState, formData: FormData): Promise<CourierActionState> {
  const parsed = z.object({ token }).safeParse({ token: formData.get("token") });
  if (!parsed.success) return { error: "invalid" };
  const ctx = await courierContext(parsed.data.token);
  if (!ctx) return { error: "invalid" };

  const db = createSupabaseAdminClient();
  const { data: rows } = await db
    .from("deliveries")
    .select("*")
    .eq("store_id", ctx.store.id)
    .eq("courier_id", ctx.courier.id)
    .eq("state", "assigned")
    .lte("scheduled_for", ctx.today)
    .returns<DeliveryRow[]>();
  if (!rows?.length) return { ok: true };

  const { data: orders } = await db.from("orders").select("*").in("id", rows.map((r) => r.order_id)).returns<OrderRow[]>();
  const byId = new Map((orders ?? []).map((o) => [o.id, o]));
  const now = new Date().toISOString();
  await db.from("deliveries").update({ state: "out_for_delivery", dispatched_at: now }).in("id", rows.map((r) => r.id));
  for (const row of rows) {
    await logCourierEvent(db, ctx.store.id, row.id, ctx.courier.id, "dispatched", {});
    const order = byId.get(row.order_id);
    if (order) await markShipped(db, order, null, { event: { delivery_id: row.id, courier_id: ctx.courier.id } });
  }
  refresh();
  return { ok: true };
}

const confirmSchema = base.extend({
  code: z.string().trim().regex(/^[0-9]{6}$/).optional().or(z.literal("")),
  recipientName: z.string().trim().min(1).max(120),
  noCodeReason: z.string().trim().max(300).optional(),
  note: z.string().trim().max(300).optional(),
  cashCollected: z.coerce.number().int().min(0).max(100_000_000).optional(),
  photoPath: z.string().trim().max(300).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

/**
 * The door. With the customer's code this runs through `confirmDeliveryWithCode`, exactly like the
 * public /deliver page and the admin dialog — one implementation of "an order is delivered".
 *
 * Without a code the stop still closes, because parcels really do get handed over to someone who
 * cannot find their email — but it demands a reason, records `verified = false`, and shows up amber
 * in the admin. Cash, photo and GPS ride along in the same submit so a courier on bad mobile data
 * makes one round trip.
 */
export async function confirmStopAction(_prev: CourierActionState, formData: FormData): Promise<CourierActionState> {
  const parsed = confirmSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "invalid" };
  const { token: tokenValue, deliveryId, code, recipientName, noCodeReason, note, cashCollected, photoPath, lat, lng } = parsed.data;

  const loaded = await loadStop(tokenValue, deliveryId);
  if (!loaded) return { error: "invalid" };
  const { ctx, db, delivery } = loaded;
  if (delivery.state !== "assigned" && delivery.state !== "out_for_delivery") return { error: "alreadyClosed" };

  const { data: order } = await db.from("orders").select("*").eq("id", delivery.order_id).maybeSingle<OrderRow>();
  if (!order) return { error: "invalid" };

  let verified = false;
  if (code) {
    const result = await confirmDeliveryWithCode(db, order, code, null);
    if (result === "wrongCode") {
      const { data: fresh } = await db.from("orders").select("delivery_attempts").eq("id", order.id).maybeSingle<{ delivery_attempts: number }>();
      return { error: "wrongCode", triesLeft: Math.max(0, 5 - (fresh?.delivery_attempts ?? 0)) };
    }
    if (result === "locked") return { error: "locked" };
    // "transition" means the order is already delivered — a double submit from a second tab. Close
    // the stop anyway rather than stranding the courier on an error they cannot act on.
    if (result === "transition" && order.status !== "delivered") return { error: "notShipped" };
    verified = result === "ok";
  } else {
    if (!noCodeReason || noCodeReason.length < 3) return { error: "reasonRequired" };
    if (!markableDelivered(order)) return { error: "notShipped" };
    await markDelivered(db, order, "manual", null);
  }

  const patch: Record<string, unknown> = {
    state: "delivered",
    completed_at: new Date().toISOString(),
    verified,
    recipient_name: recipientName,
    note: note || (noCodeReason ? `No code: ${noCodeReason}` : null),
    cash_collected: delivery.cash_expected > 0 ? (cashCollected ?? 0) : null,
    photo_url: photoPath ?? null,
    lat: lat ?? null,
    lng: lng ?? null,
  };
  // Conditional update = the optimistic lock: if another tab closed it first, this touches nothing.
  await db.from("deliveries").update(patch).eq("id", delivery.id).in("state", ["assigned", "out_for_delivery"]);
  await logCourierEvent(db, ctx.store.id, delivery.id, ctx.courier.id, "delivered", {
    verified,
    recipient_name: recipientName,
    cash_collected: patch.cash_collected,
    no_code_reason: noCodeReason ?? null,
    has_photo: Boolean(photoPath),
    has_gps: lat !== undefined && lng !== undefined,
  });
  refresh();
  return { ok: true };
}

/** `delivered` is only reachable from `shipped`; anything else means the parcel never went out. */
function markableDelivered(order: OrderRow): boolean {
  return order.status === "shipped";
}

const failSchema = base.extend({
  reason: z.enum(FAILURE_REASONS as [string, ...string[]]),
  note: z.string().trim().max(300).optional(),
});

/** Nobody home. The delivery fails; the ORDER stays shipped and staff decide what happens next. */
export async function failStopAction(_prev: CourierActionState, formData: FormData): Promise<CourierActionState> {
  const parsed = failSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "invalid" };
  const { token: tokenValue, deliveryId, reason, note } = parsed.data;
  const loaded = await loadStop(tokenValue, deliveryId);
  if (!loaded) return { error: "invalid" };
  const { ctx, db, delivery } = loaded;
  if (delivery.state !== "assigned" && delivery.state !== "out_for_delivery") return { error: "alreadyClosed" };

  await db
    .from("deliveries")
    .update({ state: "failed", completed_at: new Date().toISOString(), failure_reason: reason, note: note ?? null })
    .eq("id", delivery.id)
    .in("state", ["assigned", "out_for_delivery"]);
  await logCourierEvent(db, ctx.store.id, delivery.id, ctx.courier.id, "failed", { failure_reason: reason, note: note ?? null });
  refresh();
  return { ok: true };
}

/** Uploads the doorstep photo and hands back its storage path for the confirm submit. */
export async function uploadProofAction(formData: FormData): Promise<{ path?: string; error?: string }> {
  const tokenValue = formData.get("token");
  const deliveryId = formData.get("deliveryId");
  const file = formData.get("photo");
  if (typeof tokenValue !== "string" || typeof deliveryId !== "string" || !(file instanceof File)) return { error: "invalid" };
  const loaded = await loadStop(tokenValue, deliveryId);
  if (!loaded) return { error: "invalid" };
  return uploadProofPhoto(loaded.db, loaded.ctx.store.id, loaded.delivery.id, file);
}
