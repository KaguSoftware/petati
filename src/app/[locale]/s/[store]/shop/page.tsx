import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { storeContext, type StoreContext } from "@/lib/tenant/context";
import { getProducts } from "@/lib/catalog/queries";
import type { ProductSort } from "@/lib/catalog/types";
import { ProductGridWithWishlist } from "@/components/storefront/product-grid-with-wishlist";
import { ShopToolbar } from "@/components/storefront/shop-toolbar";
import { Pagination } from "@/components/storefront/pagination";

export default async function ShopPage({ params, searchParams }: PageProps<"/[locale]/s/[store]/shop">) {
  const ctx = await storeContext(params);
  const t = await getTranslations("shop");
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <Suspense fallback={<p className="text-muted-foreground">…</p>}>
        <Results ctx={ctx} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

export async function Results({ ctx, searchParams, categorySlug }: { ctx: StoreContext; searchParams: Promise<Record<string, string | string[] | undefined>>; categorySlug?: string }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const sort = (typeof sp.sort === "string" ? sp.sort : "newest") as ProductSort;
  const page = Number(typeof sp.page === "string" ? sp.page : 1) || 1;
  const [t, tc, result] = await Promise.all([
    getTranslations("shop"),
    getTranslations("common"),
    getProducts(ctx.store.id, ctx.locale, ctx.fallback, { search: q, sort, page, categorySlug }),
  ]);
  return (
    <>
      <ShopToolbar total={result.total} />
      <div className="-mx-4">
        <ProductGridWithWishlist ctx={ctx} products={result.items} emptyLabel={t("noResults")} />
      </div>
      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} basePath={categorySlug ? `/c/${categorySlug}` : "/shop"} query={{ q, sort }} labels={{ prev: tc("previous"), next: tc("next") }} />
    </>
  );
}
