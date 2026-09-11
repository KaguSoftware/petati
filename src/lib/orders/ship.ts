import "server-only";

import type { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OrderRow } from "@/lib/db/types";
import { canTransition } from "@/lib/admin/orders/transitions";
import { notifyCustomer } from "./notify";

type Db = ReturnType<typeof createSupabaseAdminClient>;

interface ShipInput {
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shippingCost?: number | null;
  /** Extra fields for the shipment event (e.g. the courier a delivery dispatched with). */
  event?: Record<string, unknown>;
}

/**
 * Stamps an order as shipped: status, `shipped_at`, tracking, courier cost, the `shipment` event and
 * the customer mail. Shared by the admin Ship dialog and by dispatching a delivery run, so a parcel
 * that leaves with a courier looks identical to one handed to a carrier by hand.
 *
 * Returns false when the order cannot legally move to `shipped` — the caller decides whether that is
 * an error (single order) or a skip (bulk dispatch).
 */
export async function markShipped(db: Db, order: OrderRow, actorId: string | null, input: ShipInput = {}): Promise<boolean> {
  if (!canTransition(order.status, "shipped")) return false;
  const shipping_cost = input.shippingCost ?? order.shipping_cost ?? 0;
  const tracking_number = input.trackingNumber ?? order.tracking_number;
  const tracking_url = input.trackingUrl ?? order.tracking_url;

  await db
    .from("orders")
    .update({ status: "shipped", shipped_at: new Date().toISOString(), tracking_number, tracking_url, shipping_cost })
    .eq("id", order.id);
  await db.from("order_events").insert({
    order_id: order.id,
    actor_id: actorId,
    type: "shipment",
    data: { tracking_number, tracking_url, shipping_cost, ...(input.event ?? {}) },
  });
  await notifyCustomer(db, order, "shipped", { trackingNumber: tracking_number, trackingUrl: tracking_url });
  return true;
}
