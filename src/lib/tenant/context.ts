import "server-only";

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
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
  // Every storefront page/layout resolves through here: pin the locale for next-intl (see src/i18n/request.ts).
  setRequestLocale(locale);
  return { store, locale, fallback: store.default_locale };
}
