import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/tenant/store";
import { themeToCssVars } from "@/lib/theme/types";
import { StoreProvider } from "@/components/storefront/store-provider";

/**
 * Storefront root. Resolves the tenant from the (rewritten) path, injects the store's colour
 * scheme as CSS variables so every shadcn token inside is re-skinned, and exposes store basics to
 * client components via context.
 */
export default async function StoreLayout({ children, params }: LayoutProps<"/[locale]/s/[store]">) {
  const { store: slug, locale } = await params;
  const store = await getStoreBySlug(slug);
  if (!store || !store.is_active) notFound();

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
        {children}
      </StoreProvider>
    </div>
  );
}
