/** Event types the log can filter by (shared with the client filter bar; mirrors `DeliveryEventType` minus the never-written ones). */
export const LOG_EVENT_TYPES = ["created", "assigned", "unassigned", "dispatched", "delivered", "failed", "returned", "cancelled", "settled", "note"] as const;
export type LogEventType = (typeof LOG_EVENT_TYPES)[number];
