import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { DeliveryLogTable } from "@/components/admin/delivery/delivery-log-table";
import { Pagination } from "@/components/shared/pagination";
import { requireAdminPage } from "@/lib/admin/context";
import { listDeliveryEvents } from "@/lib/admin/delivery/queries";
import { parseListParams, type SearchParams } from "@/lib/admin/list-params";

type Props = PageProps<"/[locale]/admin/delivery/log">;

export default async function DeliveryLogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  return (
    <>
      <PageHeader back={{ href: "/admin/delivery", label: t("nav.delivery") }} title={t("delivery.log.title")} description={t("delivery.log.hint")} />
      <Suspense fallback={<TableSkeleton />}>
        <Log locale={locale} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Log({ locale, searchParams }: { locale: string; searchParams: Props["searchParams"] }) {
  const ctx = await requireAdminPage(locale, "delivery.read");
  const sp = (await searchParams) as SearchParams;
  const list = parseListParams(sp, { sorts: ["created_at"], defaultSort: "created_at", pageSize: 50 });
  const [{ rows, total }, tc] = await Promise.all([listDeliveryEvents(ctx.store.id, list), getTranslations("common")]);
  return (
    <>
      <DeliveryLogTable rows={rows} locale={ctx.locale} />
      <Pagination page={list.page} pageSize={list.pageSize} total={total} basePath="/admin/delivery/log" query={{}} labels={{ prev: tc("previous"), next: tc("next") }} />
    </>
  );
}
