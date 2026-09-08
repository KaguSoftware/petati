import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ReviewsTable } from "@/components/admin/reviews/reviews-table";
import { ReviewsTabs } from "@/components/admin/reviews/reviews-tabs";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { Pagination } from "@/components/shared/pagination";
import { requireAdminPage } from "@/lib/admin/context";
import { currentQuery, parseListParams, pickParam, type SearchParams } from "@/lib/admin/list-params";
import { listReviews, reviewCounts } from "@/lib/admin/reviews/queries";
import { REVIEW_STATUSES } from "@/lib/admin/reviews/types";

type Props = PageProps<"/[locale]/admin/reviews">;

export default async function ReviewsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  return (
    <>
      <PageHeader title={t("nav.reviews")} />
      <Suspense fallback={<TableSkeleton />}>
        <ReviewsList locale={locale} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ReviewsList({ locale, searchParams }: { locale: string; searchParams: Props["searchParams"] }) {
  const ctx = await requireAdminPage(locale, "reviews.moderate");
  const sp = (await searchParams) as SearchParams;
  const status = pickParam(sp, "status", REVIEW_STATUSES) ?? "pending";
  const { page } = parseListParams(sp, { sorts: ["created_at"] as const });
  const [{ rows, total, pageSize }, counts, t] = await Promise.all([
    listReviews(ctx.store.id, { status, page, locale: ctx.locale, fallback: ctx.store.default_locale }),
    reviewCounts(ctx.store.id),
    getTranslations("common"),
  ]);
  const query = currentQuery(sp, ["status"]);
  return (
    <>
      <ReviewsTabs counts={counts} current={status} />
      <ReviewsTable rows={rows} storeId={ctx.store.id} locale={ctx.locale} status={status} />
      <Pagination page={page} pageSize={pageSize} total={total} basePath="/admin/reviews" query={query} labels={{ prev: t("previous"), next: t("next") }} />
    </>
  );
}
