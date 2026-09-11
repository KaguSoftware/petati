import "server-only";

import type { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OrderRow } from "@/lib/db/types";
import { canTransition } from "@/lib/admin/orders/transitions";
import { notifyCustomer } from "@/lib/orders/notify";
import { DELIVERY_ATTEMPT_LIMIT } from "./limits";

type Db = ReturnType<typeof createSupabaseAdminClient>;

export { DELIVERY_ATTEMPT_LIMIT } from "./limits";

export type ConfirmResult = "ok" | "wrongCode" | "locked" | "transition";

/** Constant-length compare, so a wrong code never leaks how much of it was right through timing. */
function codeMatches(input: string, actual: string): boolean {
  if (input.length !== actual.length) return false;
  let diff = 0;
  for (let i = 0; i < input.length; i++) diff |= input.charCodeAt(i) ^ actual.charCodeAt(i);
  return diff === 0;
}

/**
 * The one place an order becomes `delivered` through a code — shared by the admin dialog and the
 * public courier page, so the rules (same transition table as every other status move, the attempt
 * lockout, the timeline entry, the customer mail) cannot drift apart.
 *
 * `method` records WHO closed it: "code" for the delivery code, "manual" for a staff override.
 * `actorId` is null when the courier confirms on the public page (order_events.actor_id is nullable).
 */
export async function confirmDeliveryWithCode(
  db: Db,
  order: OrderRow,
  code: string,
  actorId: string | null,
  opts: { closeStop?: boolean } = {},
): Promise<ConfirmResult> {
  if (!canTransition(order.status, "delivered")) return "transition";
  if (order.delivery_attempts >= DELIVERY_ATTEMPT_LIMIT) return "locked";

  if (!codeMatches(code, order.delivery_code)) {
    const attempts = order.delivery_attempts + 1;
    await db.from("orders").update({ delivery_attempts: attempts }).eq("id", order.id);
    return attempts >= DELIVERY_ATTEMPT_LIMIT ? "locked" : "wrongCode";
  }

  await markDelivered(db, order, "code", actorId, opts);
  return "ok";
}

/**
 * Status write + timeline + mail for a delivered order, by code or by a staff override.
 *
 * Also closes the order's OPEN delivery stop (if any), so confirming from the order page, the search
 * box or the public /deliver page never strands a courier's stop in "out for delivery". Callers that
 * write the stop themselves with extra facts (the courier app, the admin row action) pass
 * `closeStop: false`.
 */
export async function markDelivered(db: Db, order: OrderRow, method: "code" | "manual", actorId: string | null, opts: { closeStop?: boolean } = {}) {
  await db
    .from("orders")
    .update({ status: "delivered", delivered_at: new Date().toISOString(), delivered_by: method, delivery_attempts: 0 })
    .eq("id", order.id);
  await db
    .from("order_events")
    .insert({ order_id: order.id, actor_id: actorId, type: "status_changed", data: { from: order.status, to: "delivered", method } });
  if (opts.closeStop !== false) {
    const { data: open } = await db
      .from("deliveries")
      .select("id, store_id, courier_id")
      .eq("order_id", order.id)
      .in("state", ["pending", "assigned", "out_for_delivery"])
      .maybeSingle<{ id: string; store_id: string; courier_id: string | null }>();
    if (open) {
      await db.from("deliveries").update({ state: "delivered", completed_at: new Date().toISOString(), verified: method === "code" }).eq("id", open.id);
      await db.from("delivery_events").insert({ store_id: open.store_id, delivery_id: open.id, type: "delivered", actor_id: actorId, courier_id: null, data: { verified: method === "code", via: "order" } });
    }
  }
  await notifyCustomer(db, order, "delivered");
}
