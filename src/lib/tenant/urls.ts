import "server-only";

import { env } from "@/lib/env";

function protocol() {
  try {
    return new URL(env.appUrl()).protocol;
  } catch {
    return "https:";
  }
}

/** Public storefront URL for a store slug (the default store lives on the app URL itself). */
export function storefrontUrl(slug: string, locale: string): string {
  if (slug === env.defaultStoreSlug()) return `${env.appUrl()}/${locale}`;
  return `${protocol()}//${slug}.${env.rootDomain()}/${locale}`;
}

/** Storefront URL through a custom domain attached to a store. */
export function customDomainUrl(hostname: string, locale: string): string {
  return `${protocol()}//${hostname}/${locale}`;
}

/** "<slug>.<root>" without protocol, for previews. */
export function subdomainHost(slug: string): string {
  return `${slug}.${env.rootDomain()}`;
}
