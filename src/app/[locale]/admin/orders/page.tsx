import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OrdersFilters } from "@/components/admin/orders/orders-filters";
import { OrdersTable } from "@/components/admin/orders/orders-table";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { requireAdminPage } from "@/lib/admin/context";
import { currentQuery, parseListParams, pickParam, stringParam, type SearchParams } from "@/lib/admin/list-params";
import { listOrders, orderStatusCounts, ORDER_SORTS } from "@/lib/admin/orders/queries";
import { ORDER_STATUSES } from "@/lib/admin/orders/transitions";

type Props = PageProps<"/[locale]/admin/orders">;

export default async function OrdersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  return (
    <>
      <PageHeader title={t("nav.orders")} />
      <Suspense fallback={<TableSkeleton />}>
        <OrdersList locale={locale} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function OrdersList({ locale, searchParams }: { locale: string; searchParams: Props["searchParams"] }) {
  const ctx = await requireAdminPage(locale, "orders.read");
  const sp = (await searchParams) as SearchParams;
  const list = parseListParams(sp, { sorts: ORDER_SORTS, defaultSort: "placed_at" });
  const status = pickParam(sp, "status", ORDER_STATUSES);
  const from = stringParam(sp, "from", 10);
  const to = stringParam(sp, "to", 10);
  const [{ rows, total }, counts, t] = await Promise.all([
    listOrders(ctx.store.id, { ...list, status, from, to }),
    orderStatusCounts(ctx.store.id),
    getTranslations("common"),
  ]);
  const query = currentQuery(sp, ["q", "status", "from", "to", "sort", "dir"]);
  return (
    <>
      <OrdersFilters counts={counts} current={status} />
      <OrdersTable rows={rows} locale={ctx.locale} sort={{ sort: list.sort, dir: list.dir }} query={query} />
      <Pagination page={list.page} pageSize={list.pageSize} total={total} basePath="/admin/orders" query={query} labels={{ prev: t("previous"), next: t("next") }} />
    </>
  );
}
