import "server-only";

import type { Locale } from "@/i18n/config";
import { pickTranslation } from "@/lib/catalog/types";
import { lookupDelivery } from "@/lib/admin/delivery/queries";
import type { ProductStatus } from "@/lib/db/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CourierHit, CustomerHit, GlobalSearchResult, ProductHit, SearchKind } from "./types";

export interface GlobalSearchOptions {
  locale: Locale;
  fallback: Locale;
  attemptLimit: number;
  /** Already permission-filtered by the action. */
  groups: SearchKind[];
  /** Per group. */
  limit?: number;
}

/** Strip what would break a PostgREST filter (also `_`, a LIKE wildcard). */
function safeLike(q: string) {
  return q.replace(/[,()%\\_]/g, " ").trim();
}

type Db = ReturnType<typeof createSupabaseAdminClient>;
type Translation = { locale: Locale; name: string };
type Image = { url: string; sort_order: number };

function thumb(images: Image[] | null | undefined): string | null {
  return [...(images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
}

async function customers(db: Db, storeId: string, term: string, limit: number): Promise<CustomerHit[]> {
  const { data } = await db
    .from("customers")
    .select("id, full_name, email, phone")
    .eq("store_id", storeId)
    .or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
    .order("full_name", { ascending: true, nullsFirst: false })
    .limit(limit)
    .returns<{ id: string; full_name: string | null; email: string; phone: string | null }[]>();
  return (data ?? []).map((c) => ({ id: c.id, name: c.full_name, email: c.email, phone: c.phone }));
}

/**
 * Products by name (any locale) and by SKU. A top-level `or()` cannot span two embedded tables, so
 * these are two requests in the same wave, merged by product id.
 */
async function products(db: Db, storeId: string, term: string, limit: number, locale: Locale, fallback: Locale): Promise<ProductHit[]> {
  type ByName = { id: string; status: ProductStatus; product_translations: Translation[]; product_images: Image[]; product_variants: { sku: string | null }[] };
  type BySku = { sku: string | null; products: { id: string; status: ProductStatus; store_id: string; product_translations: Translation[]; product_images: Image[] } | null };
  const [byName, bySku] = await Promise.all([
    db
      .from("products")
      .select("id, status, product_translations!inner(locale, name), product_images(url, sort_order), product_variants(sku)")
      .eq("store_id", storeId)
      .ilike("product_translations.name", `%${term}%`)
      .limit(limit)
      .returns<ByName[]>(),
    db
      .from("product_variants")
      .select("sku, products!inner(id, status, store_id, product_translations(locale, name), product_images(url, sort_order))")
      .eq("products.store_id", storeId)
      .ilike("sku", `%${term}%`)
      .limit(limit)
      .returns<BySku[]>(),
  ]);
  const out = new Map<string, ProductHit>();
  for (const p of byName.data ?? []) {
    // `!inner` returns only the matching translation rows; fall back to any row so the name is never empty.
    const name = pickTranslation(p.product_translations, locale, fallback)?.name ?? p.product_translations[0]?.name ?? "";
    out.set(p.id, { id: p.id, name, sku: p.product_variants.find((v) => v.sku)?.sku ?? null, status: p.status, thumbnail: thumb(p.product_images) });
  }
  for (const v of bySku.data ?? []) {
    const p = v.products;
    if (!p || out.has(p.id)) {
      if (p && out.has(p.id) && v.sku) out.get(p.id)!.sku = v.sku;
      continue;
    }
    const name = pickTranslation(p.product_translations, locale, fallback)?.name ?? p.product_translations[0]?.name ?? "";
    out.set(p.id, { id: p.id, name, sku: v.sku, status: p.status, thumbnail: thumb(p.product_images) });
  }
  return [...out.values()].slice(0, limit);
}

async function couriers(db: Db, storeId: string, term: string, limit: number): Promise<CourierHit[]> {
  const { data } = await db
    .from("couriers")
    .select("id, name, phone, is_active")
    .eq("store_id", storeId)
    .or(`name.ilike.%${term}%,phone.ilike.%${term}%`)
    .order("is_active", { ascending: false })
    .order("name")
    .limit(limit)
    .returns<{ id: string; name: string; phone: string | null; is_active: boolean }[]>();
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, phone: c.phone, isActive: c.is_active }));
}

/** One query, every entity, one wave. A failing group returns empty rather than blanking the palette. */
export async function globalSearch(storeId: string, q: string, opts: GlobalSearchOptions): Promise<GlobalSearchResult> {
  const query = q.trim();
  const term = safeLike(query);
  const result: GlobalSearchResult = { query };
  if (term.length < 2) return result;
  const db = createSupabaseAdminClient();
  const limit = opts.limit ?? 6;
  const want = new Set(opts.groups);
  const quiet = <T,>(p: Promise<T>, empty: T) => p.catch(() => empty);

  const [o, c, p, k] = await Promise.all([
    want.has("orders") ? quiet(lookupDelivery(storeId, query, opts.attemptLimit), []) : Promise.resolve(undefined),
    want.has("customers") ? quiet(customers(db, storeId, term, limit), []) : Promise.resolve(undefined),
    want.has("products") ? quiet(products(db, storeId, term, limit, opts.locale, opts.fallback), []) : Promise.resolve(undefined),
    want.has("couriers") ? quiet(couriers(db, storeId, term, limit), []) : Promise.resolve(undefined),
  ]);
  if (o) result.orders = o.slice(0, limit);
  if (c) result.customers = c;
  if (p) result.products = p;
  if (k) result.couriers = k;
  return result;
}
