import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { storeContext, type StoreContext } from "@/lib/tenant/context";
import { getBrands, getProducts } from "@/lib/catalog/queries";
import type { ProductSort } from "@/lib/catalog/types";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { ProductGridWithWishlist } from "@/components/storefront/product-grid-with-wishlist";
import { PageShell } from "@/components/storefront/shared/page-shell";
import { ShopToolbar } from "@/components/storefront/shop-toolbar";
import { Pagination } from "@/components/storefront/pagination";

export default async function ShopPage({ params, searchParams }: PageProps<"/[locale]/s/[store]/shop">) {
  const ctx = await storeContext(params);
  const t = await getTranslations("shop");
  return (
    <PageShell title={t("title")}>
      <Suspense fallback={<ResultsSkeleton />}>
        <Results ctx={ctx} searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}

/** Toolbar row + a 2/3/4-up grid of tiles, so the page does not jump when the results land. */
export function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <div className="h-11 w-40 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 @tablet:grid-cols-3 @tablet:gap-x-5 @desktop:grid-cols-4 @desktop:gap-x-6">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-square animate-pulse rounded-xl bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface ResultsProps {
  ctx: StoreContext;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  /** fixed category (the /c/<slug> page); includes the whole subtree */
  categorySlug?: string;
  /** fixed brand (the /b/<slug> page); hides the brand select and ignores ?brand= */
  brandSlug?: string;
}

/** Search-param reader shared by /shop, /c/<slug> and /b/<slug>; must render inside Suspense. */
export async function Results({ ctx, searchParams, categorySlug, brandSlug }: ResultsProps) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const sort = (typeof sp.sort === "string" ? sp.sort : "newest") as ProductSort;
  const page = Number(typeof sp.page === "string" ? sp.page : 1) || 1;
  const brandParam = !brandSlug && typeof sp.brand === "string" && sp.brand ? sp.brand : undefined;
  const [t, tc, result, brands] = await Promise.all([
    getTranslations("shop"),
    getTranslations("common"),
    getProducts(ctx.store.id, ctx.locale, ctx.fallback, { search: q, sort, page, categorySlug, brandSlug: brandSlug ?? brandParam }),
    brandSlug ? Promise.resolve(undefined) : getBrands(ctx.store.id),
  ]);
  const basePath = brandSlug ? `/b/${brandSlug}` : categorySlug ? `/c/${categorySlug}` : "/shop";
  const filtered = Boolean(q || brandParam);
  return (
    <div className="flex flex-col gap-6">
      <ShopToolbar total={result.total} brands={brands} />
      <ProductGridWithWishlist
        ctx={ctx}
        products={result.items}
        bare
        emptyLabel={t("noResultsTitle")}
        emptyAction={
          <Link href={filtered ? basePath : "/shop"} className={buttonVariants({ size: "xl", variant: filtered ? "outline" : "default" })}>
            {filtered ? t("clearFilters") : t("browseAll")}
          </Link>
        }
      />
      <Pagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath={basePath}
        query={{ q, sort, brand: brandParam }}
        labels={{ prev: tc("previous"), next: tc("next") }}
      />
    </div>
  );
}
