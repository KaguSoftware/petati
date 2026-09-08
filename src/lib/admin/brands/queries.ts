import "server-only";

import type { BrandRow } from "@/lib/db/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BrandAdminRow, BrandOption } from "./types";

type BrandRaw = BrandRow & { products: { count: number }[] };

/** Every brand (including inactive) with product counts, in sort order. */
export async function listBrandsAdmin(storeId: string): Promise<BrandAdminRow[]> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("brands")
    .select("*, products(count)")
    .eq("store_id", storeId)
    .order("sort_order")
    .order("name")
    .returns<BrandRaw[]>();
  if (error) throw error;
  return (data ?? []).map(({ products, ...b }) => ({ ...b, productCount: products?.[0]?.count ?? 0 }));
}

/** Compact brand list for the product form (inactive brands included so an existing link stays editable). */
export async function listBrandOptions(storeId: string): Promise<BrandOption[]> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from("brands").select("id, name").eq("store_id", storeId).order("sort_order").order("name").returns<BrandOption[]>();
  if (error) throw error;
  return data ?? [];
}
