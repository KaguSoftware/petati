import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ShippingRateRow } from "@/lib/db/types";

/** All shipping rates of a store (admin view, uncached — the storefront uses `getShippingRates`). */
export async function listShippingRates(storeId: string): Promise<ShippingRateRow[]> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("shipping_rates")
    .select("*")
    .eq("store_id", storeId)
    .order("sort_order")
    .order("id")
    .returns<ShippingRateRow[]>();
  if (error) throw error;
  return data ?? [];
}
