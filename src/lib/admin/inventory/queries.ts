import "server-only";

import type { Locale } from "@/i18n/config";
import type { ListParams } from "@/lib/admin/list-params";
import { pickJson, pickTranslation } from "@/lib/catalog/types";
import type { ProductTranslationRow, StockMovementRow, StockReason, Translated } from "@/lib/db/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MovementRow, StockRow, StockSort } from "./types";

type Db = ReturnType<typeof createSupabaseAdminClient>;

function safeLike(q: string) {
  return q.replace(/[,()%\\_]/g, " ").trim();
}

type VariantLabelRaw = {
  variant_option_values: { product_option_values: { value: Translated; sort_order: number; product_options: { sort_order: number } | null } | null }[];
};

function variantLabel(v: VariantLabelRaw, locale: Locale, fallback: Locale): string {
  return v.variant_option_values
    .map((x) => x.product_option_values)
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => (a.product_options?.sort_order ?? 0) - (b.product_options?.sort_order ?? 0) || a.sort_order - b.sort_order)
    .map((x) => pickJson(x.value, locale, fallback))
    .filter(Boolean)
    .join(" · ");
}

const VARIANT_LABEL_SELECT = "variant_option_values(product_option_values(value, sort_order, product_options(sort_order)))";

type StockRaw = VariantLabelRaw & {
  id: string;
  product_id: string;
  sku: string | null;
  stock_qty: number;
  track_inventory: boolean;
  allow_backorder: boolean;
  is_active: boolean;
  products: { product_translations: Pick<ProductTranslationRow, "locale" | "name">[] } | null;
};

export function stockLevel(v: { stock_qty: number; track_inventory: boolean }, threshold: number): StockRow["level"] {
  if (!v.track_inventory) return "ok";
  if (v.stock_qty <= 0) return "out";
  return v.stock_qty <= threshold ? "low" : "ok";
}

export async function listStock(
  storeId: string,
  params: ListParams<StockSort> & { lowOnly?: boolean; threshold: number; locale: Locale; fallback: Locale },
): Promise<{ rows: StockRow[]; total: number }> {
  const db = createSupabaseAdminClient();
  let q = db
    .from("product_variants")
    .select(`id, product_id, sku, stock_qty, track_inventory, allow_backorder, is_active, products!inner(product_translations(locale, name)), ${VARIANT_LABEL_SELECT}`, { count: "exact" })
    .eq("store_id", storeId);
  if (params.lowOnly) q = q.eq("track_inventory", true).eq("is_active", true).lte("stock_qty", params.threshold);
  const term = safeLike(params.q);
  if (term) {
    const { data: hits } = await db
      .from("product_translations")
      .select("product_id, products!inner(store_id)")
      .eq("products.store_id", storeId)
      .ilike("name", `%${term}%`)
      .returns<{ product_id: string }[]>();
    const ids = [...new Set((hits ?? []).map((h) => h.product_id))];
    q = ids.length ? q.or(`sku.ilike.%${term}%,product_id.in.(${ids.join(",")})`) : q.ilike("sku", `%${term}%`);
  }
  const { data, count, error } = await q
    .order(params.sort, { ascending: params.dir === "asc", nullsFirst: false })
    .order("id")
    .range(params.range.from, params.range.to)
    .returns<StockRaw[]>();
  if (error) throw error;
  const rows = (data ?? []).map((v) => ({
    variantId: v.id,
    productId: v.product_id,
    productName: pickTranslation(v.products?.product_translations, params.locale, params.fallback)?.name ?? "",
    variantLabel: variantLabel(v, params.locale, params.fallback),
    sku: v.sku,
    stock_qty: v.stock_qty,
    track_inventory: v.track_inventory,
    allow_backorder: v.allow_backorder,
    is_active: v.is_active,
    threshold: params.threshold,
    level: stockLevel(v, params.threshold),
  }));
  return { rows, total: count ?? 0 };
}

export async function lowStockCount(storeId: string): Promise<number> {
  const db = createSupabaseAdminClient();
  const { count, error } = await db.from("v_low_stock").select("variant_id", { count: "exact", head: true }).eq("store_id", storeId);
  if (error) throw error;
  return count ?? 0;
}

type MovementRaw = StockMovementRow & {
  profiles: { full_name: string | null } | null;
  orders: { number: string } | null;
  product_variants: (VariantLabelRaw & { sku: string | null; product_id: string; products: { product_translations: Pick<ProductTranslationRow, "locale" | "name">[] } | null }) | null;
};

export async function listMovements(
  storeId: string,
  params: { variantId?: string; reason?: StockReason; page: number; pageSize: number; range: { from: number; to: number }; locale: Locale; fallback: Locale },
): Promise<{ rows: MovementRow[]; total: number }> {
  const db = createSupabaseAdminClient();
  let q = db
    .from("stock_movements")
    .select(`*, profiles(full_name), orders(number), product_variants(sku, product_id, products(product_translations(locale, name)), ${VARIANT_LABEL_SELECT})`, { count: "exact" })
    .eq("store_id", storeId);
  if (params.variantId) q = q.eq("variant_id", params.variantId);
  if (params.reason) q = q.eq("reason", params.reason);
  const { data, count, error } = await q.order("created_at", { ascending: false }).range(params.range.from, params.range.to).returns<MovementRaw[]>();
  if (error) throw error;
  const rows = (data ?? []).map((m) => ({
    id: m.id,
    created_at: m.created_at,
    variantId: m.variant_id,
    productId: m.product_variants?.product_id ?? "",
    productName: pickTranslation(m.product_variants?.products?.product_translations, params.locale, params.fallback)?.name ?? "",
    variantLabel: m.product_variants ? variantLabel(m.product_variants, params.locale, params.fallback) : "",
    sku: m.product_variants?.sku ?? null,
    delta: m.delta,
    reason: m.reason,
    actorName: m.profiles?.full_name ?? null,
    orderId: m.order_id,
    orderNumber: m.orders?.number ?? null,
    note: m.note,
  }));
  return { rows, total: count ?? 0 };
}

/** Label for a single variant (movements page header when filtered by variant). */
export async function getVariantLabel(storeId: string, variantId: string, locale: Locale, fallback: Locale): Promise<{ productName: string; variantLabel: string; sku: string | null } | null> {
  const db: Db = createSupabaseAdminClient();
  const { data } = await db
    .from("product_variants")
    .select(`sku, products(product_translations(locale, name)), ${VARIANT_LABEL_SELECT}`)
    .eq("store_id", storeId)
    .eq("id", variantId)
    .maybeSingle<VariantLabelRaw & { sku: string | null; products: { product_translations: Pick<ProductTranslationRow, "locale" | "name">[] } | null }>();
  if (!data) return null;
  return { productName: pickTranslation(data.products?.product_translations, locale, fallback)?.name ?? "", variantLabel: variantLabel(data, locale, fallback), sku: data.sku };
}
