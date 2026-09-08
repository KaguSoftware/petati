import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ListParams } from "@/lib/admin/list-params";
import type { AddressRow } from "@/lib/db/types";
import type { CustomerDetail, CustomerSort, CustomerStatsRow, MarketingFilter } from "./types";

/** Strip characters that would break a PostgREST `or()` filter. */
function safeLike(q: string) {
  return q.replace(/[,()%\\]/g, " ").trim();
}

export async function listCustomers(
  storeId: string,
  params: ListParams<CustomerSort> & { marketing?: MarketingFilter },
): Promise<{ rows: CustomerStatsRow[]; total: number }> {
  const db = createSupabaseAdminClient();
  let q = db.from("v_customer_stats").select("*", { count: "exact" }).eq("store_id", storeId);
  if (params.marketing) q = q.eq("accepts_marketing", params.marketing === "yes");
  const term = safeLike(params.q);
  if (term) q = q.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  const { data, count, error } = await q
    .order(params.sort, { ascending: params.dir === "asc", nullsFirst: false })
    .order("id", { ascending: true })
    .range(params.range.from, params.range.to)
    .returns<CustomerStatsRow[]>();
  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}

export async function getCustomer(storeId: string, id: string): Promise<CustomerDetail | null> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from("v_customer_stats").select("*").eq("store_id", storeId).eq("id", id).maybeSingle<CustomerStatsRow>();
  if (error) throw error;
  if (!data) return null;
  const { data: addresses, error: addrError } = await db
    .from("addresses")
    .select("*")
    .eq("customer_id", id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })
    .returns<AddressRow[]>();
  if (addrError) throw addrError;
  return { ...data, addresses: addresses ?? [] };
}
