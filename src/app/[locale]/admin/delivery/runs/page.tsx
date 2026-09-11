import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { DayNav } from "@/components/admin/delivery/day-nav";
import { RunsStrip } from "@/components/admin/delivery/runs-strip";
import { requireAdminPage } from "@/lib/admin/context";
import { listTodayRuns, storeToday } from "@/lib/admin/delivery/queries";
import { stringParam, type SearchParams } from "@/lib/admin/list-params";

type Props = PageProps<"/[locale]/admin/delivery/runs">;

export default async function RunsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  return (
    <>
      <PageHeader back={{ href: "/admin/delivery", label: t("nav.delivery") }} title={t("delivery.runs.title")} description={t("delivery.runs.subtitle")} />
      <Suspense fallback={<TableSkeleton />}>
        <Content locale={locale} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** One tile per courier for the day: the "who is out" answer, and the way into every run sheet. */
async function Content({ locale, searchParams }: { locale: string; searchParams: Props["searchParams"] }) {
  const ctx = await requireAdminPage(locale, "delivery.read");
  const sp = (await searchParams) as SearchParams;
  const today = storeToday(ctx.store.timezone);
  const raw = stringParam(sp, "d", 10);
  const day = raw && ISO.test(raw) ? raw : today;
  const runs = await listTodayRuns(ctx.store.id, day);
  return (
    <div className="flex flex-col gap-4">
      <DayNav day={day} today={today} basePath="/admin/delivery/runs" locale={ctx.locale} />
      <RunsStrip runs={runs} date={day} currency={ctx.store.currency} locale={ctx.locale} variant="cards" />
    </div>
  );
}
