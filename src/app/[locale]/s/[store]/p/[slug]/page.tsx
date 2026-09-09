import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { storeContext } from "@/lib/tenant/context";
import { getApprovedReviews, getProductBySlug } from "@/lib/catalog/queries";
import { renderSection } from "@/lib/theme/registry";
import { getSessionUser } from "@/lib/auth/session";
import { getMyWishlistIds } from "@/lib/account/queries";
import { AddToCartPanel } from "@/components/storefront/shared/add-to-cart-panel";
import { ReviewForm } from "@/components/storefront/shared/review-form";
import { GuestWishlistButton, WishlistButton } from "@/components/storefront/shared/wishlist-button";

export async function generateMetadata({ params }: PageProps<"/[locale]/s/[store]/p/[slug]">): Promise<Metadata> {
  const ctx = await storeContext(params);
  const { slug } = await params;
  const product = await getProductBySlug(ctx.store.id, slug, ctx.locale, ctx.fallback);
  if (!product) return {};
  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.shortDescription ?? undefined,
    openGraph: product.imageUrl ? { images: [product.imageUrl] } : undefined,
  };
}

export default async function ProductPage({ params }: PageProps<"/[locale]/s/[store]/p/[slug]">) {
  const ctx = await storeContext(params);
  const { store, locale, fallback } = ctx;
  const { slug } = await params;
  const product = await getProductBySlug(store.id, slug, locale, fallback);
  if (!product) notFound();

  const [t, reviews] = await Promise.all([getTranslations("product"), getApprovedReviews(product.id)]);
  return renderSection("productPage", store.theme.sections.productPage, {
    product,
    currency: store.currency,
    locale,
    labels: {
      description: t("description"),
      sku: t("sku"),
      reviews: t("reviews"),
      inStock: t("inStock"),
      outOfStock: t("outOfStock"),
      previousImage: t("previousImage"),
      nextImage: t("nextImage"),
      imageOf: t.raw("imageOf") as string,
    },
    purchasePanel: <AddToCartPanel product={product} storeSlug={store.slug} currency={store.currency} locale={locale} />,
    wishlistSlot: (
      <Suspense>
        <ProductWishlist storeId={store.id} storeSlug={store.slug} productId={product.id} />
      </Suspense>
    ),
    reviewsSection: renderSection("reviews", store.theme.sections.reviews, {
      reviews,
      ratingAvg: product.ratingAvg,
      ratingCount: product.ratingCount,
      locale,
      labels: { title: t("reviews"), empty: t("noReviews"), verified: t("verifiedPurchase") },
      formSlot: (
        <Suspense>
          <ReviewFormGate storeSlug={store.slug} productId={product.id} signInLabel={t("signInToReview")} />
        </Suspense>
      ),
    }),
  });
}

async function ProductWishlist({ storeId, storeSlug, productId }: { storeId: string; storeSlug: string; productId: string }) {
  const user = await getSessionUser();
  if (!user) return <GuestWishlistButton />;
  const ids = await getMyWishlistIds(storeId);
  return <WishlistButton storeSlug={storeSlug} productId={productId} active={ids.has(productId)} />;
}

async function ReviewFormGate({ storeSlug, productId, signInLabel }: { storeSlug: string; productId: string; signInLabel: string }) {
  const user = await getSessionUser();
  if (!user) return <p className="text-sm text-muted-foreground">{signInLabel}</p>;
  return <ReviewForm storeSlug={storeSlug} productId={productId} />;
}
