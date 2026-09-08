import type { OrderStatus } from "@/lib/db/types";

/** Allowed manual status moves from the admin. Refunds are recorded via refundOrderAction. */
export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["paid", "cancelled"],
  paid: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export const ORDER_STATUSES: OrderStatus[] = ["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Statuses whose stock reservation should be released when cancelled. */
export const RESTOCK_ON_CANCEL: OrderStatus[] = ["pending_payment", "paid", "processing"];

/** Statuses that count as "paid" for refund purposes. */
export const REFUNDABLE: OrderStatus[] = ["paid", "processing", "shipped", "delivered", "refunded"];
