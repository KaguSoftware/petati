"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { adminMutation, actionError } from "@/lib/admin/guard";
import type { ActionState } from "@/lib/admin/types";
import { moneyField, optionalMoneyField, optionalText, parseForm, uuidField } from "@/lib/admin/validate";
import { catalogTag } from "@/lib/catalog/queries";
import type { OrderItemRow, OrderRow, OrderStatus, PaymentRow } from "@/lib/db/types";
import { sendEmail } from "@/lib/email/send";
import { env } from "@/lib/env";
import { getProviderByKey } from "@/lib/payments";
import { OrderStatusEmail } from "@/emails/order-status";
import { canTransition, ORDER_STATUSES, REFUNDABLE, RESTOCK_ON_CANCEL } from "./transitions";

const base = z.object({ storeId: uuidField, orderId: uuidField });

type Db = Awaited<ReturnType<typeof adminMutation>>["db"];

async function loadOrder(db: Db, storeId: string, orderId: string) {
  const { data } = await db.from("orders").select("*").eq("store_id", storeId).eq("id", orderId).maybeSingle<OrderRow>();
  return data ?? null;
}

async function logEvent(db: Db, orderId: string, actorId: string, type: string, data: Record<string, unknown>) {
  await db.from("order_events").insert({ order_id: orderId, actor_id: actorId, type, data });
}

async function notifyCustomer(db: Db, order: OrderRow, status: OrderStatus, extra: { trackingNumber?: string | null; trackingUrl?: string | null } = {}) {
  const { data: store } = await db.from("stores").select("slug, name, email_from").eq("id", order.store_id).maybeSingle<{ slug: string; name: string; email_from: string | null }>();
  if (!store) return;
  await sendEmail({
    to: order.email,
    from: store.email_from,
    subject: `${store.name} · ${order.number}`,
    react: OrderStatusEmail({
      storeName: store.name,
      orderNumber: order.number,
      orderUrl: `${env.appUrl()}/${order.locale}/order/${order.id}`,
      locale: order.locale,
      status,
      trackingNumber: extra.trackingNumber ?? order.tracking_number,
      trackingUrl: extra.trackingUrl ?? order.tracking_url,
    }),
  });
}

/** Manual provider: money arrived offline. Marks payment + order paid. */
export async function markPaidAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(base.extend({ reference: optionalText(120) }), formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, orderId, reference } = parsed.data;
  try {
    const { db, user } = await adminMutation(storeId, "orders.update");
    const order = await loadOrder(db, storeId, orderId);
    if (!order) return { error: "notFound" };
    if (!canTransition(order.status, "paid")) return { error: "transition" };

    const { data: payment } = await db.from("payments").select("*").eq("order_id", order.id).eq("store_id", storeId).order("created_at", { ascending: false }).limit(1).maybeSingle<PaymentRow>();
    if (!payment) return { error: "noPayment" };
    const provider = getProviderByKey(payment.provider);
    if (!provider) return { error: "noPayment" };
    const { providerRef } = await provider.markPaid(payment, reference);

    const now = new Date().toISOString();
    await db.from("payments").update({ status: "paid", provider_ref: providerRef }).eq("id", payment.id);
    await db.from("orders").update({ status: "paid", paid_at: now }).eq("id", order.id);
    await logEvent(db, order.id, user.id, "payment", { status: "paid", reference: providerRef });
    await notifyCustomer(db, order, "paid");
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}

/** Generic transitions (processing, delivered, cancelled). Cancelling releases reserved stock. */
export async function updateOrderStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(base.extend({ status: z.enum(ORDER_STATUSES as [OrderStatus, ...OrderStatus[]]) }), formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, orderId, status } = parsed.data;
  if (status === "paid") return { error: "transition" }; // use markPaidAction
  try {
    const { db, user } = await adminMutation(storeId, "orders.update");
    const order = await loadOrder(db, storeId, orderId);
    if (!order) return { error: "notFound" };
    if (!canTransition(order.status, status)) return { error: "transition" };

    const patch: Record<string, unknown> = { status };
    const now = new Date().toISOString();
    if (status === "delivered") patch.delivered_at = now;
    if (status === "cancelled") patch.cancelled_at = now;
    await db.from("orders").update(patch).eq("id", order.id);
    await logEvent(db, order.id, user.id, "status_changed", { from: order.status, to: status });

    if (status === "cancelled" && RESTOCK_ON_CANCEL.includes(order.status)) {
      const { data: items } = await db.from("order_items").select("variant_id, quantity").eq("order_id", order.id).returns<Pick<OrderItemRow, "variant_id" | "quantity">[]>();
      const movements = (items ?? [])
        .filter((i) => i.variant_id)
        .map((i) => ({ store_id: storeId, variant_id: i.variant_id, delta: i.quantity, reason: "return", order_id: order.id, actor_id: user.id, note: `Cancelled ${order.number}` }));
      if (movements.length) await db.from("stock_movements").insert(movements);
      updateTag(catalogTag(storeId));
    }
    if (status === "cancelled" || status === "delivered") await notifyCustomer(db, order, status);
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}

export async function shipOrderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(
    base.extend({
      tracking_number: optionalText(80),
      tracking_url: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.url().max(500).nullable()),
    }),
    formData,
  );
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, orderId, tracking_number, tracking_url } = parsed.data;
  try {
    const { db, user } = await adminMutation(storeId, "orders.update");
    const order = await loadOrder(db, storeId, orderId);
    if (!order) return { error: "notFound" };
    if (!canTransition(order.status, "shipped")) return { error: "transition" };
    // Courier cost needs the order's currency, so it is parsed after the order is loaded. Empty → keep the checkout value.
    const costParsed = parseForm(z.object({ shipping_cost: optionalMoneyField(order.currency) }), formData);
    if (!costParsed.data) return { error: "invalid", fieldErrors: costParsed.fieldErrors };
    const shipping_cost = costParsed.data.shipping_cost ?? order.shipping_cost ?? 0;
    await db.from("orders").update({ status: "shipped", shipped_at: new Date().toISOString(), tracking_number, tracking_url, shipping_cost }).eq("id", order.id);
    await logEvent(db, order.id, user.id, "shipment", { tracking_number, tracking_url, shipping_cost });
    await notifyCustomer(db, order, "shipped", { trackingNumber: tracking_number, trackingUrl: tracking_url });
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}

/**
 * Records a refund against the latest payment. SCOPE(payments): the manual provider only records
 * the refund; iyzico refunds + automatic restock GROWS LATER.
 */
export async function refundOrderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const pre = parseForm(base, formData);
  if (!pre.data) return { error: "invalid", fieldErrors: pre.fieldErrors };
  const { storeId, orderId } = pre.data;
  try {
    const { db, user } = await adminMutation(storeId, "orders.refund");
    const order = await loadOrder(db, storeId, orderId);
    if (!order) return { error: "notFound" };
    if (!REFUNDABLE.includes(order.status)) return { error: "transition" };
    const parsed = parseForm(z.object({ amount: moneyField(order.currency, { min: 1 }), reason: optionalText(300) }), formData);
    if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
    const remaining = order.total - order.refunded_total;
    if (parsed.data.amount > remaining) return { error: "invalid", fieldErrors: { amount: "refundTooLarge" } };

    const { data: payment } = await db.from("payments").select("*").eq("order_id", order.id).eq("store_id", storeId).order("created_at", { ascending: false }).limit(1).maybeSingle<PaymentRow>();
    if (!payment) return { error: "noPayment" };
    const provider = getProviderByKey(payment.provider);
    if (!provider) return { error: "noPayment" };
    const { providerRef } = await provider.refund(payment, parsed.data.amount);

    const refundedTotal = order.refunded_total + parsed.data.amount;
    const full = refundedTotal >= order.total;
    await db.from("refunds").insert({ payment_id: payment.id, order_id: order.id, amount: parsed.data.amount, reason: parsed.data.reason, actor_id: user.id, provider_ref: providerRef });
    await db.from("payments").update({ status: full ? "refunded" : "partially_refunded" }).eq("id", payment.id);
    await db.from("orders").update({ refunded_total: refundedTotal, ...(full ? { status: "refunded" } : {}) }).eq("id", order.id);
    await logEvent(db, order.id, user.id, "refund", { amount: parsed.data.amount, reason: parsed.data.reason, full });
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}

export async function saveInternalNoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(base.extend({ internal_note: optionalText(2000) }), formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, orderId, internal_note } = parsed.data;
  try {
    const { db, user } = await adminMutation(storeId, "orders.update");
    const order = await loadOrder(db, storeId, orderId);
    if (!order) return { error: "notFound" };
    await db.from("orders").update({ internal_note }).eq("id", order.id);
    await logEvent(db, order.id, user.id, "note", { internal_note });
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}

