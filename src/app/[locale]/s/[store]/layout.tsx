import { NAVBAR_VARS, themeToCssVars } from "@/lib/theme/types";
import { storeContext } from "@/lib/tenant/context";
import { StoreProvider } from "@/components/storefront/store-provider";
import { StoreChrome } from "@/components/storefront/store-chrome";
import { cn } from "@/lib/utils";

/**
 * Storefront root. Resolves the tenant from the (rewritten) path, injects the store's colour
 * scheme as CSS variables so every shadcn token inside is re-skinned, exposes store basics to
 * client components via context, and wraps pages in the store's chosen chrome.
 */
export default async function StoreLayout({ children, params }: LayoutProps<"/[locale]/s/[store]">) {
  const ctx = await storeContext(params);
  const { store, locale } = ctx;

  // `@container` lives on an outer box: a container query never matches the element that declares
  // it, so the navbar's `@tablet:` variables must sit on a descendant of the container.
  return (
    <div className="@container">
      <div
        data-storefront
        className={cn("flex min-h-screen flex-col bg-background font-sans text-foreground *:w-full", NAVBAR_VARS[store.theme.sections.navbar])}
        style={themeToCssVars(store.theme, locale) as React.CSSProperties}
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
    </div>
  );
}
