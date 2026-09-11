import "server-only";

import { cache } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { DeliveryFailure, DeliveryState } from "@/lib/db/types";

export interface CustomerDeliveryView {
  attempt: number;
  state: DeliveryState;
  at: string | null;
  scheduledFor: string | null;
  failureReason: DeliveryFailure | null;
  recipientName: string | null;
  verified: boolean;
  /** First name only — the customer never sees a courier's full identity or phone. */
  courierFirstName: string | null;
}

/**
 * What the shopper may know about their own parcel. The select list is short on purpose: no courier
 * phone, no other stops, no GPS, no proof photo, no internal note.
 */
export const getOrderDeliveries = cache(async (storeId: string, orderId: string): Promise<CustomerDeliveryView[]> => {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("deliveries")
    .select("attempt_no, state, completed_at, dispatched_at, scheduled_for, failure_reason, recipient_name, verified, couriers(name)")
    .eq("store_id", storeId)
    .eq("order_id", orderId)
    .order("attempt_no", { ascending: true })
    .returns<
      {
        attempt_no: number;
        state: DeliveryState;
        completed_at: string | null;
        dispatched_at: string | null;
        scheduled_for: string | null;
        failure_reason: DeliveryFailure | null;
        recipient_name: string | null;
        verified: boolean;
        couriers: { name: string } | null;
      }[]
    >();
  return (data ?? []).map((d) => ({
    attempt: d.attempt_no,
    state: d.state,
    at: d.completed_at ?? d.dispatched_at,
    scheduledFor: d.scheduled_for,
    failureReason: d.failure_reason,
    recipientName: d.recipient_name,
    verified: d.verified,
    courierFirstName: d.couriers?.name?.split(" ")[0] ?? null,
  }));
});
