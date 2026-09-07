import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isLocale } from "@/i18n/config";
import { DEFAULT_THEME, VARIANT_KEYS, themeToCssVars, type VariantKey } from "@/lib/theme/types";
import { renderSection } from "@/lib/theme/registry";
import { fixtureCart, fixtureCategories, fixtureProduct, fixtureProducts, fixtureReviews } from "@/lib/theme/fixtures";
import { computeTotals } from "@/lib/checkout/totals";
import { formatMoney } from "@/lib/money";
import { StoreProvider } from "@/components/storefront/store-provider";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { AccountButtonFallback } from "@/components/storefront/shared/account-button";
import { CartButtonFallback } from "@/components/storefront/shared/cart-button";
import { AddToCartPanel } from "@/components/storefront/shared/add-to-cart-panel";
import { CartLineControls } from "@/components/storefront/shared/cart-line-controls";
import { CouponForm } from "@/components/storefront/shared/coupon-form";
import { CheckoutForm } from "@/components/storefront/shared/checkout-form";
import { NewsletterForm } from "@/components/storefront/shared/newsletter-form";
import { ReviewForm } from "@/components/storefront/shared/review-form";

/**
 * Dev-only visual harness: every section of one variant rendered with fixture data, no database.
 * Used to QA mobile/desktop layouts and, later, as the admin design picker's preview.
 */
export default async function PreviewPage({ params }: PageProps<"/[locale]/preview/[variant]">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { locale, variant } = await params;
  if (!isLocale(locale) || !(VARIANT_KEYS as readonly string[]).includes(variant)) notFound();
  const v = variant as VariantKey;

  const [t, tn, tf, tp, tc, tco, ta] = await Promise.all([
    getTranslations("home"),
    getTranslations("nav"),
    getTranslations("footer"),
    getTranslations("product"),
    getTranslations("cart"),
    getTranslations("checkout"),
    getTranslations("admin"),
  ]);
  const currency = "TRY";
  const storeName = "Petati";
  const store = { id: "preview", slug: "preview", name: storeName, currency, locale, enabledLocales: ["en", "tr", "fa"], logoUrl: null };
  const totals = computeTotals(fixtureCart, { id: "r", store_id: "s", name: { en: "Standard" }, rate: 4990, free_over: 200000, countries: null, min_days: 2, max_days: 5, is_active: true, sort_order: 0 }, { tax_rate_bp: 2000, prices_include_tax: true });

  return (
    <div data-storefront className="flex min-h-screen flex-col bg-background text-foreground" style={themeToCssVars(DEFAULT_THEME) as React.CSSProperties}>
      <StoreProvider value={store}>
        {renderSection("announcementBar", v, { text: "Free shipping on orders over ₺2.000" })}
        {renderSection("navbar", v, {
          storeName,
          logoUrl: null,
          categories: fixtureCategories,
          labels: { home: tn("home"), shop: tn("shop"), search: tn("search"), menu: tn("menu") },
          localeSlot: <LocaleSwitcher />,
          accountSlot: <AccountButtonFallback />,
          cartSlot: <CartButtonFallback />,
        })}
        <Label text={`${ta("design")} · ${v} · hero`} />
        {renderSection("hero", v, { title: t("heroTitle"), subtitle: t("heroSubtitle"), ctaLabel: t("shopNow"), ctaHref: "/shop", imageUrl: fixtureProducts[0].imageUrl })}
        <Label text="categoryBanner" />
        {renderSection("categoryBanner", v, { title: t("browseCategories"), categories: fixtureCategories })}
        <Label text="productGrid + productCard" />
        {renderSection("productGrid", v, { title: t("featured"), products: fixtureProducts, currency, locale, cardVariant: v, emptyLabel: "", viewAllHref: "/shop", viewAllLabel: t("viewAll") })}
        <Label text="productPage + reviews" />
        {renderSection("productPage", v, {
          product: fixtureProduct,
          currency,
          locale,
          labels: { description: tp("description"), sku: tp("sku"), reviews: tp("reviews"), inStock: tp("inStock"), outOfStock: tp("outOfStock") },
          purchasePanel: <AddToCartPanel product={fixtureProduct} storeSlug="preview" currency={currency} locale={locale} />,
          reviewsSection: renderSection("reviews", v, {
            reviews: fixtureReviews,
            ratingAvg: 4.5,
            ratingCount: 12,
            locale,
            labels: { title: tp("reviews"), empty: tp("noReviews"), verified: tp("verifiedPurchase") },
            formSlot: <ReviewForm storeSlug="preview" productId="00000000-0000-4000-8000-000000000009" />,
          }),
        })}
        <Label text="cartDrawer (cart view)" />
        {renderSection("cartDrawer", v, {
          cart: fixtureCart,
          totals,
          currency,
          locale,
          labels: {
            title: tc("title"), empty: tc("empty"), subtotal: tc("subtotal"), discount: tc("discount"), shipping: tc("shipping"), tax: tc("tax"), total: tc("total"),
            checkout: tc("checkout"), continueShopping: tc("continueShopping"), freeShipping: tc("freeShipping"),
            shippingNote: tc("freeShippingOver", { amount: formatMoney(200000, currency, locale) }),
          },
          lineControls: Object.fromEntries(fixtureCart.lines.map((l) => [l.id, <CartLineControls key={l.id} storeSlug="preview" itemId={l.id} quantity={l.quantity} maxQty={l.maxQty} />])),
          couponSlot: <CouponForm storeSlug="preview" appliedCode={null} />,
          checkoutHref: "/checkout",
          shopHref: "/shop",
        })}
        <Label text="checkout" />
        {renderSection("checkout", v, {
          title: tco("title"),
          form: <CheckoutForm storeSlug="preview" locale={locale} currency={currency} email={null} addresses={[]} shippingOptions={[{ id: "00000000-0000-4000-8000-000000000010", name: "Standard", rate: 4990, freeOver: 200000, isFree: false }, { id: "00000000-0000-4000-8000-000000000011", name: "Express", rate: 9990, freeOver: null, isFree: false }]} defaultCountry="TR" />,
          summary: <p className="text-sm text-muted-foreground">{tc("subtotal")}: {formatMoney(fixtureCart.subtotal, currency, locale)}</p>,
        })}
        <Label text="newsletter + footer" />
        {renderSection("newsletter", v, { title: tf("newsletter"), subtitle: tf("newsletterSubtitle"), formSlot: <NewsletterForm storeSlug="preview" /> })}
        {renderSection("footer", v, {
          storeName,
          tagline: t("heroSubtitle"),
          categories: fixtureCategories,
          contactEmail: "hello@petati.local",
          contactPhone: "+90 555 000 0000",
          labels: { categories: tn("categories"), contact: tf("contact"), rights: tf("rights"), about: tf("about"), privacy: tf("privacy"), terms: tf("terms") },
          localeSlot: <LocaleSwitcher />,
          year: 2026,
        })}
      </StoreProvider>
    </div>
  );
}

function Label({ text }: { text: string }) {
  return <div className="bg-yellow-200 px-4 py-1 text-xs font-mono text-yellow-900">preview · {text}</div>;
}
