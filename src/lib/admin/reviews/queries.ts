import "server-only";

import type { Locale } from "@/i18n/config";
import { ADMIN_PAGE_SIZE } from "@/lib/admin/constants";
import { pickTranslation } from "@/lib/catalog/types";
import type { ReviewRow, ReviewStatus } from "@/lib/db/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ReviewListRow } from "./types";

interface Raw extends ReviewRow {
  products: { slug: string; product_translations: { locale: Locale; name: string }[] | null } | null;
  profiles: { full_name: string | null; email: string | null } | null;
  customers: { email: string; full_name: string | null } | null;
}

export async function listReviews(
  storeId: string,
  params: { status: ReviewStatus; page: number; locale: Locale; fallback: Locale },
): Promise<{ rows: ReviewListRow[]; total: number; pageSize: number }> {
  const db = createSupabaseAdminClient();
  const from = (params.page - 1) * ADMIN_PAGE_SIZE;
  const { data, count, error } = await db
    .from("reviews")
    .select("*, products(slug, product_translations(locale, name)), profiles(full_name, email), customers(email, full_name)", { count: "exact" })
    .eq("store_id", storeId)
    .eq("status", params.status)
    .order("created_at", { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1)
    .returns<Raw[]>();
  if (error) throw error;
  const rows = (data ?? []).map(({ products, profiles, customers, ...r }) => ({
    ...r,
    product_name: pickTranslation(products?.product_translations, params.locale, params.fallback)?.name ?? products?.slug ?? "—",
    product_slug: products?.slug ?? null,
    author_name: profiles?.full_name ?? customers?.full_name ?? null,
    author_email: profiles?.email ?? customers?.email ?? null,
  }));
  return { rows, total: count ?? 0, pageSize: ADMIN_PAGE_SIZE };
}

/** Per-status counts for the tabs. SCOPE(reviews): counts all rows; GROWS LATER → SQL aggregate. */
export async function reviewCounts(storeId: string): Promise<Record<ReviewStatus, number>> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from("reviews").select("status").eq("store_id", storeId).returns<{ status: ReviewStatus }[]>();
  if (error) throw error;
  const counts: Record<ReviewStatus, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const r of data ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1;
  return counts;
}
