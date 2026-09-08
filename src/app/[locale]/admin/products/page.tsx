import { FolderTree, Plus } from "lucide-react";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductsFilters } from "@/components/admin/products/products-filters";
import { ProductsTable } from "@/components/admin/products/products-table";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/lib/admin/context";
import { currentQuery, parseListParams, pickParam, stringParam, type SearchParams } from "@/lib/admin/list-params";
import { listCategoryOptions, listProducts, productStatusCounts } from "@/lib/admin/products/queries";
import { PRODUCT_SORTS, PRODUCT_STATUSES } from "@/lib/admin/products/types";
import { can } from "@/lib/auth/permissions";

type Props = PageProps<"/[locale]/admin/products">;

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  return (
    <>
      <PageHeader
        title={t("nav.products")}
        actions={
          <>
            <Link href="/admin/products/categories" className={buttonVariants({ variant: "outline" })}>
              <FolderTree data-icon="inline-start" />
              {t("crumbs.categories")}
            </Link>
            <Link href="/admin/products/new" className={buttonVariants()}>
              <Plus data-icon="inline-start" />
              {t("products.new")}
            </Link>
          </>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <ProductsList locale={locale} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ProductsList({ locale, searchParams }: { locale: string; searchParams: Props["searchParams"] }) {
  const ctx = await requireAdminPage(locale, "products.read");
  const sp = (await searchParams) as SearchParams;
  const list = parseListParams(sp, { sorts: PRODUCT_SORTS, defaultSort: "updated_at" });
  const status = pickParam(sp, "status", PRODUCT_STATUSES);
  const categoryId = stringParam(sp, "category", 36);
  const fallback = ctx.store.default_locale;
  const [{ rows, total }, counts, categories, t] = await Promise.all([
    listProducts(ctx.store.id, { ...list, status, categoryId, locale: ctx.locale, fallback }),
    productStatusCounts(ctx.store.id),
    listCategoryOptions(ctx.store.id, ctx.locale, fallback),
    getTranslations("common"),
  ]);
  const query = currentQuery(sp, ["q", "status", "category", "sort", "dir"]);
  return (
    <>
      <ProductsFilters counts={counts} status={status} categoryId={categoryId} categories={categories} />
      <ProductsTable
        rows={rows}
        storeId={ctx.store.id}
        locale={ctx.locale}
        currency={ctx.store.currency}
        lowStockThreshold={ctx.store.low_stock_threshold}
        canWrite={can(ctx.role, "products.write")}
        sort={{ sort: list.sort, dir: list.dir }}
        query={query}
      />
      <Pagination page={list.page} pageSize={list.pageSize} total={total} basePath="/admin/products" query={query} labels={{ prev: t("previous"), next: t("next") }} />
    </>
  );
}
