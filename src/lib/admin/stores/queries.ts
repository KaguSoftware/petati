import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StoreDomainRow, StoreRow } from "@/lib/db/types";
import type { StoreListItem } from "./types";

type ListRow = Pick<StoreRow, "id" | "slug" | "name" | "logo_url" | "currency" | "default_locale" | "enabled_locales" | "is_active" | "created_at">;

/** Every store with its domains (owner-only caller; the service-role client bypasses RLS). */
export async function listStoresWithDomains(): Promise<StoreListItem[]> {
  const db = createSupabaseAdminClient();
  const [storesRes, domainsRes] = await Promise.all([
    db.from("stores").select("id, slug, name, logo_url, currency, default_locale, enabled_locales, is_active, created_at").order("created_at").returns<ListRow[]>(),
    db.from("store_domains").select("*").order("is_primary", { ascending: false }).order("hostname").returns<StoreDomainRow[]>(),
  ]);
  if (storesRes.error) throw storesRes.error;
  if (domainsRes.error) throw domainsRes.error;
  const byStore = new Map<string, StoreDomainRow[]>();
  for (const d of domainsRes.data ?? []) {
    const list = byStore.get(d.store_id) ?? [];
    list.push(d);
    byStore.set(d.store_id, list);
  }
  return (storesRes.data ?? []).map((s) => ({ ...s, domains: byStore.get(s.id) ?? [] }));
}

export async function getStoreDomains(storeId: string): Promise<StoreDomainRow[]> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from("store_domains").select("*").eq("store_id", storeId).order("is_primary", { ascending: false }).order("hostname").returns<StoreDomainRow[]>();
  if (error) throw error;
  return data ?? [];
}
