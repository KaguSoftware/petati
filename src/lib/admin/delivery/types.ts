import type { CourierRow, DeliveryFailure, DeliveryRow, DeliveryState, OrderStatus } from "@/lib/db/types";

export const DELIVERY_STATES: readonly DeliveryState[] = ["pending", "assigned", "out_for_delivery", "delivered", "failed", "returned", "cancelled"];

export const FAILURE_REASONS: readonly DeliveryFailure[] = ["no_answer", "wrong_address", "refused", "postponed", "unsafe", "other"];

export const COURIER_VEHICLES = ["motorbike", "car", "van", "bicycle", "on_foot"] as const;

/**
 * Board buckets. `needs` is not a delivery state — it is orders that ought to be on their way and
 * have no open delivery row, which is how the module bootstraps itself on a store full of orders.
 */
export const BOARD_BUCKETS = ["needs", "assigned", "out_for_delivery", "failed", "done"] as const;
export type BoardBucket = (typeof BOARD_BUCKETS)[number];

/** Order statuses that deserve a delivery: paid for and not yet gone. */
export const DELIVERABLE_STATUSES: readonly OrderStatus[] = ["paid", "processing", "shipped"];

/** Allowed manual moves on the board. Delivered/failed are recorded at the door, not picked here. */
export const DELIVERY_TRANSITIONS: Record<DeliveryState, DeliveryState[]> = {
  pending: ["assigned", "cancelled"],
  assigned: ["out_for_delivery", "pending", "cancelled"],
  out_for_delivery: ["delivered", "failed", "returned"],
  delivered: [],
  failed: ["returned"],
  returned: [],
  cancelled: [],
};

/** A delivery joined with the order and courier facts the board and run sheet need. */
export interface DeliveryListRow extends DeliveryRow {
  order_number: string;
  order_status: OrderStatus;
  order_total: number;
  currency: string;
  customer_name: string | null;
  phone: string | null;
  city: string | null;
  courier_name: string | null;
}

/** An order that needs delivering and has no open delivery row yet. */
export interface UndeliveredOrderRow {
  id: string;
  number: string;
  status: OrderStatus;
  total: number;
  currency: string;
  placed_at: string;
  customer_name: string | null;
  city: string | null;
  /** Minor units still owed; 0 when the order is already paid. */
  cash_expected: number;
}

export interface CourierWithLoad extends CourierRow {
  /** Open stops (assigned or out for delivery) right now. */
  open_stops: number;
  /** Unsettled cash the courier is holding, minor units. */
  cash_held: number;
}

export interface DeliveryKpis {
  outForDelivery: number;
  scheduledToday: number;
  deliveredToday: number;
  failedToday: number;
  unverified: number;
  cashOutstanding: number;
}
