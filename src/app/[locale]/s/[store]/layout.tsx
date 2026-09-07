import { themeToCssVars } from "@/lib/theme/types";
import { storeContext } from "@/lib/tenant/context";
import { StoreProvider } from "@/components/storefront/store-provider";
import { StoreChrome } from "@/components/storefront/store-chrome";

/**
 * Storefront root. Resolves the tenant from the (rewritten) path, injects the store's colour
 * scheme as CSS variables so every shadcn token inside is re-skinned, exposes store basics to
 * client components via context, and wraps pages in the store's chosen chrome.
 */
export default async function StoreLayout({ children, params }: LayoutProps<"/[locale]/s/[store]">) {
  const ctx = await storeContext(params);
  const { store, locale } = ctx;

  return (
    <div
      data-storefront
      className="flex min-h-screen flex-col bg-background text-foreground"
      style={themeToCssVars(store.theme) as React.CSSProperties}
    >
      <StoreProvider
        value={{
          id: store.id,
          slug: store.slug,
          name: store.name,
          currency: store.currency,
          locale,
          enabledLocales: store.enabled_locales,
          logoUrl: store.logo_url,
        }}
      >
        <StoreChrome ctx={ctx}>{children}</StoreChrome>
      </StoreProvider>
    </div>
  );
}
