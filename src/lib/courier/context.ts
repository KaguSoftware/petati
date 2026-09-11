import "server-only";

import { cache } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CourierRow, OrderAddress } from "@/lib/db/types";
import { getStoreBySlug, type Store } from "@/lib/tenant/store";
import { storeToday } from "@/lib/admin/delivery/queries";

export interface CourierContext {
  courier: CourierRow;
  store: Store;
  /** Store-local dates the stop list covers: today plus anything overdue. */
  today: string;
  since: string;
}

/**
 * Resolves a courier's private link.
 *
 * Deliberately NOT a `"use cache"` function: the token is the credential, and a token-keyed entry in
 * the Cache Components cache would be a cross-request leak. `cache()` is per-request memoisation
 * only, which is what a layout + page pair needs.
 *
 * Returns null for a malformed, unknown, or deactivated token — the page then 404s, so an attacker
 * cannot tell "no such courier" from "that courier was switched off".
 */
export const courierContext = cache(async (token: string): Promise<CourierContext | null> => {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("couriers")
    .select("*, stores(slug)")
    .eq("token", token)
    .maybeSingle<CourierRow & { stores: { slug: string } | null }>();
  if (!data || !data.is_active || !data.stores) return null;

  const store = await getStoreBySlug(data.stores.slug);
  if (!store || !store.is_active) return null;

  const today = storeToday(store.timezone);
  // A leaked link is a leak of one working day, not of the customer book: three days back covers a
  // weekend of overdue stops and nothing more.
  const since = storeToday(store.timezone, -3);
  return { courier: data, store, today, since };
});

export interface CourierStop {
  id: string;
  state: string;
  sort_order: number;
  attempt_no: number;
  scheduled_for: string | null;
  slot: string | null;
  order_id: string;
  order_number: string;
  /** Minor units to collect at the door; 0 when the order is already paid. */
  cash_expected: number;
  cash_collected: number | null;
  currency: string;
  customer_name: string | null;
  phone: string | null;
  address: OrderAddress | null;
  customer_note: string | null;
  item_count: number;
  recipient_name: string | null;
  verified: boolean;
  failure_reason: string | null;
  /** Wrong-code tries the customer's code has left before it locks. */
  code_tries_left: number;
}

type JoinedStop = {
  id: string;
  state: string;
  sort_order: number;
  attempt_no: number;
  scheduled_for: string | null;
  slot: string | null;
  order_id: string;
  cash_expected: number;
  cash_collected: number | null;
  recipient_name: string | null;
  verified: boolean;
  failure_reason: string | null;
  orders: {
    number: string;
    currency: string;
    phone: string | null;
    customer_note: string | null;
    delivery_attempts: number;
    shipping_address: OrderAddress | null;
    customers: { full_name: string | null } | null;
    order_items: { quantity: number }[];
  } | null;
};

/**
 * The stops on this courier's phone. Never selects the customer's email, the order total, or the
 * delivery code itself — the courier needs an address, a phone and an amount, nothing more.
 */
export async function getCourierStops(ctx: CourierContext, attemptLimit: number): Promise<CourierStop[]> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("deliveries")
    .select(
      "id, state, sort_order, attempt_no, scheduled_for, slot, order_id, cash_expected, cash_collected, recipient_name, verified, failure_reason, orders(number, currency, phone, customer_note, delivery_attempts, shipping_address, customers(full_name), order_items(quantity))",
    )
    .eq("store_id", ctx.store.id)
    .eq("courier_id", ctx.courier.id)
    .gte("scheduled_for", ctx.since)
    .lte("scheduled_for", ctx.today)
    .order("sort_order", { ascending: true })
    .returns<JoinedStop[]>();

  return (data ?? []).map((d) => {
    const o = d.orders;
    const address = o?.shipping_address ?? null;
    return {
      id: d.id,
      state: d.state,
      sort_order: d.sort_order,
      attempt_no: d.attempt_no,
      scheduled_for: d.scheduled_for,
      slot: d.slot,
      order_id: d.order_id,
      order_number: o?.number ?? "—",
      cash_expected: d.cash_expected,
      cash_collected: d.cash_collected,
      currency: o?.currency ?? ctx.store.currency,
      customer_name: o?.customers?.full_name ?? address?.full_name ?? null,
      phone: address?.phone ?? o?.phone ?? null,
      address,
      customer_note: o?.customer_note ?? null,
      item_count: (o?.order_items ?? []).reduce((n, i) => n + i.quantity, 0),
      recipient_name: d.recipient_name,
      verified: d.verified,
      failure_reason: d.failure_reason,
      code_tries_left: Math.max(0, attemptLimit - (o?.delivery_attempts ?? 0)),
    };
  });
}
