"use server";

import { z } from "zod";
import { isLocale, type Locale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";
import { actionError } from "@/lib/admin/guard";
import type { ActionState } from "@/lib/admin/types";
import { uuidField } from "@/lib/admin/validate";
import { can, type Permission } from "@/lib/auth/permissions";
import { getRoleForStore } from "@/lib/auth/session";
import { deliveryFromSettings } from "@/lib/delivery/settings";
import { listStores } from "@/lib/tenant/store";
import { globalSearch } from "./queries";
import type { GlobalSearchResult, SearchKind } from "./types";

const GROUP_PERMISSION: Record<SearchKind, Permission> = {
  orders: "orders.read",
  customers: "customers.read",
  products: "products.read",
  couriers: "delivery.read",
};

const schema = z.object({ storeId: uuidField, q: z.string().trim().max(60), locale: z.string().max(5) });

/**
 * The header search. Not a form action: the palette calls it directly inside a transition. The
 * role is read once and each group is included only if the role may see it, so a staff member gets
 * a shorter palette rather than a forbidden error.
 */
export async function globalSearchAction(storeId: string, q: string, locale: string): Promise<ActionState & { result?: GlobalSearchResult }> {
  const parsed = schema.safeParse({ storeId, q, locale });
  if (!parsed.success) return { error: "invalid" };
  try {
    const role = await getRoleForStore(parsed.data.storeId);
    if (!role) return { error: "forbidden" };
    const groups = (Object.keys(GROUP_PERMISSION) as SearchKind[]).filter((g) => can(role, GROUP_PERMISSION[g]));
    if (groups.length === 0) return { error: "forbidden" };
    const store = (await listStores()).find((s) => s.id === parsed.data.storeId);
    if (!store) return { error: "notFound" };
    const loc: Locale = isLocale(parsed.data.locale) ? parsed.data.locale : defaultLocale;
    const result = await globalSearch(parsed.data.storeId, parsed.data.q, {
      locale: loc,
      fallback: store.default_locale,
      attemptLimit: deliveryFromSettings(store.settings).attemptLimit,
      groups,
    });
    return { ok: true, result };
  } catch (err) {
    return { error: actionError(err) };
  }
}
