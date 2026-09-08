import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StoreRow } from "@/lib/db/types";
import { parseTheme, type StoreTheme } from "@/lib/theme/types";

export type Store = Omit<StoreRow, "theme"> & { theme: StoreTheme };

/** Cache profile for lookups that found nothing: seconds, not hours. */
const MISS_LIFE = { stale: 5, revalidate: 10, expire: 60 } as const;

export function storeCacheTag(slug: string) {
  return `store:${slug.toLowerCase()}`;
}

function hydrate(row: StoreRow): Store {
  return { ...row, theme: parseTheme(row.theme) };
}

/** Cached store lookup by slug. Invalidate with updateTag(storeCacheTag(slug)) after settings save. */
export async function getStoreBySlug(slug: string): Promise<Store | null> {
  "use cache";
  cacheTag(storeCacheTag(slug), "stores");
  cacheLife("hours");

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("stores")
    .select("*")
    .eq("slug", slug.toLowerCase())
    .maybeSingle<StoreRow>();
  if (error) throw error;
  // A miss must not be pinned for hours (a store created a moment later would stay invisible).
  if (!data) cacheLife(MISS_LIFE);
  return data ? hydrate(data) : null;
}

/** Cached custom-domain lookup. Returns the slug so the proxy can rewrite. */
export async function getStoreSlugByHostname(hostname: string): Promise<string | null> {
  "use cache";
  cacheTag(`domain:${hostname.toLowerCase()}`, "stores");
  cacheLife("hours");

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("store_domains")
    .select("stores!inner(slug)")
    .eq("hostname", hostname.toLowerCase())
    .maybeSingle<{ stores: { slug: string } }>();
  if (error) throw error;
  if (!data) cacheLife(MISS_LIFE);
  return data?.stores.slug ?? null;
}

/** All stores (admin context + switcher). Cached under the "stores" tag, which every store mutation updates. */
export async function listStores(): Promise<Store[]> {
  "use cache";
  cacheTag("stores");
  cacheLife("hours");

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("stores")
    .select("*")
    .order("created_at")
    .returns<StoreRow[]>();
  if (error) throw error;
  return data.map(hydrate);
}
