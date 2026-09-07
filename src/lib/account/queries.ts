import "server-only";

import { cache } from "react";
import type { Locale } from "@/i18n/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/session";
import type { AddressRow, OrderItemRow, OrderRow, PaymentRow } from "@/lib/db/types";
import { getProducts } from "@/lib/catalog/queries";
import type { ProductCardData } from "@/lib/catalog/types";

export type OrderWithItems = OrderRow & { order_items: OrderItemRow[]; payments: PaymentRow[] };

/** Orders for the signed-in user in this store. */
export const getMyOrders = cache(async (storeId: string): Promise<OrderRow[]> => {
  const user = await getSessionUser();
  if (!user) return [];
  const { data } = await createSupabaseAdminClient()
    .from("orders")
    .select("*")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .order("placed_at", { ascending: false })
    .returns<OrderRow[]>();
  return data ?? [];
});

/**
 * Order detail by id. The uuid itself is the access token for guests (unguessable); signed-in
 * users additionally must own it OR be staff (staff view lives in admin, not here).
 */
export const getOrderForViewer = cache(async (storeId: string, orderId: string): Promise<OrderWithItems | null> => {
  const { data } = await createSupabaseAdminClient()
    .from("orders")
    .select("*, order_items(*), payments(*)")
    .eq("store_id", storeId)
    .eq("id", orderId)
    .maybeSingle<OrderWithItems>();
  if (!data) return null;
  const user = await getSessionUser();
  if (data.user_id && user?.id !== data.user_id) return null;
  return data;
});

export const getMyAddresses = cache(async (storeId: string): Promise<AddressRow[]> => {
  const user = await getSessionUser();
  if (!user) return [];
  const { data } = await createSupabaseAdminClient()
    .from("addresses")
    .select("*, customers!inner(store_id, user_id)")
    .eq("customers.store_id", storeId)
    .eq("customers.user_id", user.id)
    .order("is_default", { ascending: false })
    .returns<AddressRow[]>();
  return data ?? [];
});

export const getMyWishlistIds = cache(async (storeId: string): Promise<Set<string>> => {
  const user = await getSessionUser();
  if (!user) return new Set();
  const { data } = await createSupabaseAdminClient()
    .from("wishlist_items")
    .select("product_id")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .returns<{ product_id: string }[]>();
  return new Set((data ?? []).map((w) => w.product_id));
});

export async function getMyWishlistProducts(
  storeId: string,
  locale: Locale,
  fallback: Locale,
): Promise<ProductCardData[]> {
  const ids = await getMyWishlistIds(storeId);
  if (ids.size === 0) return [];
  const all = await getProducts(storeId, locale, fallback, { pageSize: 48 });
  return all.items.filter((p) => ids.has(p.id));
}
