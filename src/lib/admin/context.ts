import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getAdminStoreIds, getRoleForStore, requireCompleteProfile, type SessionUser } from "@/lib/auth/session";
import { can, type Permission } from "@/lib/auth/permissions";
import type { EffectiveRole } from "@/lib/db/types";
import { features } from "@/lib/env";
import { listStores, type Store } from "@/lib/tenant/store";
import { ADMIN_STORE_COOKIE } from "./constants";

export interface AdminContext {
  ok: true;
  locale: Locale;
  user: SessionUser;
  role: EffectiveRole;
  /** The store the admin is working on (cookie → first accessible). */
  store: Store;
  /** Every store the user may administer. Owner → all. */
  stores: Store[];
  /** SCOPE(multi-store, unpaid): true only when the flag is on AND the user is Owner. */
  multiStore: boolean;
}

export interface NoStoreContext {
  ok: false;
  locale: Locale;
  user: SessionUser;
}

/**
 * Everything the admin frame and pages need, resolved once per request (React `cache`).
 * Reads cookies + session, so callers must sit inside a <Suspense> boundary.
 */
export const adminContext = cache(async (localeParam: string): Promise<AdminContext | NoStoreContext> => {
  const locale: Locale = isLocale(localeParam) ? localeParam : "en";
  // The store list does not depend on the session: start it before the profile round trip so the
  // two overlap (each is one network hop from the function).
  const storesPromise = listStores();
  const user = await requireCompleteProfile(locale, `/${locale}/admin`);

  const [accessible, allStores] = await Promise.all([getAdminStoreIds(), storesPromise]);
  const stores = accessible === "all" ? allStores : allStores.filter((s) => accessible.includes(s.id));
  if (stores.length === 0) return { ok: false, locale, user };

  const cookieStore = await cookies();
  const wanted = cookieStore.get(ADMIN_STORE_COOKIE)?.value;
  const store = stores.find((s) => s.id === wanted) ?? stores[0];
  const role = (await getRoleForStore(store.id)) ?? (user.profile.platform_role === "owner" ? "owner" : null);
  if (!role) return { ok: false, locale, user };

  return { ok: true, locale, user, role, store, stores, multiStore: features.multiStore() && role === "owner" };
});

/**
 * Page-level guard: resolves the admin context and 404s when the user lacks `permission`
 * (matching the nav filter, so a staff member typing /admin/finance sees the same 404).
 */
export async function requireAdminPage(localeParam: string, permission: Permission): Promise<AdminContext> {
  const ctx = await adminContext(localeParam);
  if (!ctx.ok || !can(ctx.role, permission)) notFound();
  return ctx;
}
