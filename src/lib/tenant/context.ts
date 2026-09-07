import "server-only";

import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getStoreBySlug, type Store } from "@/lib/tenant/store";

export interface StoreContext {
  store: Store;
  locale: Locale;
  /** store default locale, used as translation fallback */
  fallback: Locale;
}

/** Resolve store + locale from route params for any page under /[locale]/s/[store]. */
export async function storeContext(params: Promise<{ locale: string; store: string }>): Promise<StoreContext> {
  const { locale, store: slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store || !store.is_active || !isLocale(locale)) notFound();
  return { store, locale, fallback: store.default_locale };
}
