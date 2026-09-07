import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { storeContext, type StoreContext } from "@/lib/tenant/context";
import { getCart } from "@/lib/cart/cart";
import { getShippingRates } from "@/lib/catalog/queries";
import { computeTotals } from "@/lib/checkout/totals";
import { renderSection } from "@/lib/theme/registry";
import { formatMoney } from "@/lib/money";
import { CartLineControls } from "@/components/storefront/shared/cart-line-controls";
import { CouponForm } from "@/components/storefront/shared/coupon-form";

export default async function CartPage({ params }: PageProps<"/[locale]/s/[store]/cart">) {
  const ctx = await storeContext(params);
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10 text-muted-foreground">…</div>}>
      <CartContent ctx={ctx} />
    </Suspense>
  );
}

async function CartContent({ ctx }: { ctx: StoreContext }) {
  const { store, locale } = ctx;
  const [t, cart, rates] = await Promise.all([getTranslations("cart"), getCart(store, locale), getShippingRates(store.id)]);
  const rate = rates[0] ?? null;
  const totals = computeTotals(cart, rate, store);

  const shippingNote =
    totals.freeShippingApplied
      ? t("freeShipping")
      : rate?.free_over != null && cart.subtotal < rate.free_over
        ? `${formatMoney(totals.shipping, store.currency, locale)} · ${t("freeShippingOver", { amount: formatMoney(rate.free_over, store.currency, locale) })}`
        : null;

  return renderSection("cartDrawer", store.theme.sections.cartDrawer, {
    cart,
    totals,
    currency: store.currency,
    locale,
    labels: {
        title: t("title"),
        empty: t("empty"),
        subtotal: t("subtotal"),
        discount: t("discount"),
        shipping: t("shipping"),
        tax: t("tax"),
        total: t("total"),
        checkout: t("checkout"),
        continueShopping: t("continueShopping"),
        shippingNote,
    },
    lineControls: Object.fromEntries(
      cart.lines.map((l) => [l.id, <CartLineControls key={l.id} storeSlug={store.slug} itemId={l.id} quantity={l.quantity} maxQty={l.maxQty} />]),
    ),
    couponSlot: <CouponForm storeSlug={store.slug} appliedCode={cart.coupon?.code ?? null} />,
    checkoutHref: "/checkout",
    shopHref: "/shop",
  });
}
