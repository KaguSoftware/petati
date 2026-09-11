import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { TabbedPanels } from "@/components/admin/shared/tabbed-panels";
import { DeliveryKpiRow } from "@/components/admin/delivery/delivery-kpis";
import { DeliverySearch } from "@/components/admin/delivery/delivery-search";
import { DeliveryStatsPanel } from "@/components/admin/delivery/delivery-stats";
import { DispatchTable } from "@/components/admin/delivery/dispatch-table";
import { QueueTable } from "@/components/admin/delivery/queue-table";
import { RunsStrip } from "@/components/admin/delivery/runs-strip";
import { DeliveryNavActions } from "@/components/admin/delivery/delivery-nav-actions";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/lib/admin/context";
import { getDeliveryKpis, getDeliveryStats, listCouriers, listDeliveries, listTodayRuns, listUndeliveredOrders, storeToday } from "@/lib/admin/delivery/queries";
import { deliveryFromSettings } from "@/lib/delivery/settings";
import { can } from "@/lib/auth/permissions";

type Props = PageProps<"/[locale]/admin/delivery">;

export default async function DeliveryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  return (
    <>
      <PageHeader
        title={t("nav.delivery")}
        description={t("delivery.description")}
        actions={
          <Suspense fallback={null}>
            <NavActions locale={locale} />
          </Suspense>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <Board locale={locale} />
      </Suspense>
    </>
  );
}

async function NavActions({ locale }: { locale: string }) {
  const ctx = await requireAdminPage(locale, "delivery.read");
  return <DeliveryNavActions canManage={can(ctx.role, "delivery.manage")} />;
}

/**
 * The dispatch board. Every bucket is fetched up front in one wave and switched client-side, per the
 * fast-admin rule — a dispatcher flips between "needs a courier" and "out now" constantly.
 */
async function Board({ locale }: { locale: string }) {
  const ctx = await requireAdminPage(locale, "delivery.read");
  const canAssign = can(ctx.role, "delivery.assign");
  const settings = deliveryFromSettings(ctx.store.settings);
  // Runtime reads are done: safe to look at the clock (Cache Components).
  const today = storeToday(ctx.store.timezone);
  const tomorrow = storeToday(ctx.store.timezone, settings.leadDays);

  const [kpis, couriers, queue, assigned, out, failed, done, unverified, runs, stats, t] = await Promise.all([
    getDeliveryKpis(ctx.store.id, ctx.store.timezone),
    listCouriers(ctx.store.id, false),
    listUndeliveredOrders(ctx.store.id),
    listDeliveries(ctx.store.id, { states: ["pending", "assigned"] }),
    listDeliveries(ctx.store.id, { states: ["out_for_delivery"] }),
    listDeliveries(ctx.store.id, { states: ["failed", "returned"] }),
    listDeliveries(ctx.store.id, { states: ["delivered"], limit: 25, newestFirst: true }),
    listDeliveries(ctx.store.id, { unverifiedOnly: true, limit: 50, newestFirst: true }),
    listTodayRuns(ctx.store.id, today),
    getDeliveryStats(ctx.store.id, ctx.store.timezone),
    getTranslations("admin"),
  ]);

  const courierOptions = couriers.map((c) => ({ id: c.id, name: c.name }));
  const shared = { storeId: ctx.store.id, locale: ctx.locale, canAssign, couriers: courierOptions, today, tomorrow, slots: settings.slots, codEnabled: settings.codEnabled };

  const panels = [
    { value: "needs", label: t("delivery.bucket.needs"), count: queue.length, content: <QueueTable rows={queue} {...shared} /> },
    { value: "assigned", label: t("delivery.bucket.assigned"), count: assigned.rows.length, content: <DispatchTable rows={assigned.rows} bucket="assigned" {...shared} /> },
    { value: "out_for_delivery", label: t("delivery.bucket.out_for_delivery"), count: out.rows.length, content: <DispatchTable rows={out.rows} bucket="out" {...shared} /> },
    { value: "failed", label: t("delivery.bucket.failed"), count: failed.rows.length, content: <DispatchTable rows={failed.rows} bucket="failed" {...shared} /> },
    { value: "unverified", label: t("delivery.bucket.unverified"), count: unverified.total, content: <DispatchTable rows={unverified.rows} bucket="unverified" {...shared} noBulk /> },
    { value: "done", label: t("delivery.bucket.done"), count: done.rows.length, content: <DispatchTable rows={done.rows} bucket="done" {...shared} noBulk /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <DeliverySearch storeId={ctx.store.id} canConfirm={can(ctx.role, "orders.update")} locale={ctx.locale} />
      <DeliveryKpiRow kpis={kpis} currency={ctx.store.currency} locale={ctx.locale} canCash={can(ctx.role, "delivery.cash")} />
      {runs.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">{t("delivery.runs.title")}</h2>
            <Link href="/admin/delivery/runs" className="text-sm underline-offset-4 hover:underline">
              {t("dashboard.viewAll")}
            </Link>
          </div>
          <RunsStrip runs={runs} date={today} currency={ctx.store.currency} locale={ctx.locale} />
        </section>
      )}
      <TabbedPanels label={t("common.status")} param="bucket" defaultValue="needs" panels={panels} />
      <DeliveryStatsPanel stats={stats} locale={ctx.locale} currency={ctx.store.currency} />
    </div>
  );
}
