import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { storeContext } from "@/lib/tenant/context";
import { getCategories, getProducts } from "@/lib/catalog/queries";
import { renderSection } from "@/lib/theme/registry";
import { ProductGridWithWishlist } from "@/components/storefront/product-grid-with-wishlist";
import { NewsletterForm } from "@/components/storefront/shared/newsletter-form";

export default async function StoreHome({ params }: PageProps<"/[locale]/s/[store]">) {
  const ctx = await storeContext(params);
  const { store, locale, fallback } = ctx;
  const [t, tf, categories, featured, newest] = await Promise.all([
    getTranslations("home"),
    getTranslations("footer"),
    getCategories(store.id, locale, fallback),
    getProducts(store.id, locale, fallback, { featuredOnly: true, pageSize: 8 }),
    getProducts(store.id, locale, fallback, { sort: "newest", pageSize: 8 }),
  ]);

  const heroImage = featured.items[0]?.imageUrl ?? newest.items[0]?.imageUrl ?? null;

  return (
    <main>
      {renderSection("hero", store.theme.sections.hero, {
        title: (store.settings.hero_title as Record<string, string> | undefined)?.[locale] ?? t("heroTitle"),
        subtitle: (store.settings.hero_subtitle as Record<string, string> | undefined)?.[locale] ?? store.tagline ?? t("heroSubtitle"),
        ctaLabel: t("shopNow"),
        ctaHref: "/shop",
        imageUrl: (store.settings.hero_image as string | undefined) ?? heroImage,
      })}
      {renderSection("categoryBanner", store.theme.sections.categoryBanner, {
        title: t("browseCategories"),
        categories: categories.filter((c) => !c.parentId),
      })}
      <Suspense>
        <ProductGridWithWishlist ctx={ctx} title={t("featured")} products={featured.items} emptyLabel="" viewAllHref="/shop" viewAllLabel={t("viewAll")} />
      </Suspense>
      <Suspense>
        <ProductGridWithWishlist ctx={ctx} title={t("newArrivals")} products={newest.items} emptyLabel="" viewAllHref="/shop?sort=newest" viewAllLabel={t("viewAll")} />
      </Suspense>
      {renderSection("newsletter", store.theme.sections.newsletter, {
        title: tf("newsletter"),
        subtitle: tf("newsletterSubtitle"),
        formSlot: <NewsletterForm storeSlug={store.slug} />,
      })}
    </main>
  );
}
