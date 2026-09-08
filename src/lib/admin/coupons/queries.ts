import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ListParams } from "@/lib/admin/list-params";
import type { CouponRow } from "@/lib/db/types";
import type { CouponSort, CouponWithRedemptions } from "./types";

function safeLike(q: string) {
  return q.replace(/[,()%\\]/g, " ").trim();
}

export async function listCoupons(storeId: string, params: ListParams<CouponSort>): Promise<{ rows: CouponRow[]; total: number }> {
  const db = createSupabaseAdminClient();
  let q = db.from("coupons").select("*", { count: "exact" }).eq("store_id", storeId);
  const term = safeLike(params.q);
  if (term) q = q.ilike("code", `%${term}%`);
  const { data, count, error } = await q
    .order(params.sort, { ascending: params.dir === "asc", nullsFirst: false })
    .order("id", { ascending: true })
    .range(params.range.from, params.range.to)
    .returns<CouponRow[]>();
  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}

export async function getCouponWithRedemptions(storeId: string, id: string): Promise<CouponWithRedemptions | null> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("coupons")
    .select("*, coupon_redemptions(*, orders(id, number, email, currency), customers(id, email, full_name))")
    .eq("store_id", storeId)
    .eq("id", id)
    .order("created_at", { referencedTable: "coupon_redemptions", ascending: false })
    .maybeSingle<CouponWithRedemptions>();
  if (error) throw error;
  return data ?? null;
}
