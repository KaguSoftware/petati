import { getTranslations } from "next-intl/server";
import { storeContext } from "@/lib/tenant/context";
import { getMyWishlistProducts } from "@/lib/account/queries";
import { ProductGridWithWishlist } from "@/components/storefront/product-grid-with-wishlist";

export default async function WishlistPage({ params }: PageProps<"/[locale]/s/[store]/account/wishlist">) {
  const ctx = await storeContext(params);
  const [t, products] = await Promise.all([getTranslations("account"), getMyWishlistProducts(ctx.store.id, ctx.locale, ctx.fallback)]);
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{t("wishlist")}</h2>
      <div className="-mx-4">
        <ProductGridWithWishlist ctx={ctx} products={products} emptyLabel={t("wishlistEmpty")} />
      </div>
    </div>
  );
}
