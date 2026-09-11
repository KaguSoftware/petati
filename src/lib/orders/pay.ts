import "server-only";

import type { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OrderRow, PaymentRow } from "@/lib/db/types";
import { canTransition } from "@/lib/admin/orders/transitions";
import { getProviderByKey } from "@/lib/payments";
import { notifyCustomer } from "./notify";

type Db = ReturnType<typeof createSupabaseAdminClient>;

export type PayResult = "ok" | "noPayment" | "alreadyPaid";

/**
 * The one way an order becomes paid outside a gateway callback: the money is recorded through the
 * order's own payment provider. Lifted out of `markPaidAction` so that cash handed over by a courier
 * settles down exactly the same path as a bank transfer typed in by a manager — a second
 * implementation writing `orders.status` directly would drift from the payments ledger.
 *
 * `orders.status` is only moved when the transition table allows it. That matters for cash on
 * delivery: by the time the money is counted the order is already `delivered`, and `delivered` is
 * the fact worth keeping — the payment is recorded on the payments row and `paid_at`, not by
 * rewinding the order's status.
 */
export async function markOrderPaid(db: Db, order: OrderRow, reference: string | null, actorId: string | null): Promise<PayResult> {
  const { data: payment } = await db
    .from("payments")
    .select("*")
    .eq("order_id", order.id)
    .eq("store_id", order.store_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<PaymentRow>();
  if (!payment) return "noPayment";
  if (payment.status === "paid") return "alreadyPaid";
  const provider = getProviderByKey(payment.provider);
  if (!provider) return "noPayment";

  const { providerRef } = await provider.markPaid(payment, reference ?? undefined);
  await db.from("payments").update({ status: "paid", provider_ref: providerRef }).eq("id", payment.id);

  const patch: Record<string, unknown> = { paid_at: new Date().toISOString() };
  const movesStatus = canTransition(order.status, "paid");
  if (movesStatus) patch.status = "paid";
  await db.from("orders").update(patch).eq("id", order.id);

  await db.from("order_events").insert({ order_id: order.id, actor_id: actorId, type: "payment", data: { status: "paid", reference: providerRef } });
  // Only worth a mail when the order actually changed state for the customer; a delivered parcel
  // whose cash is being counted in the back office is not news to them.
  if (movesStatus) await notifyCustomer(db, order, "paid");
  return "ok";
}

