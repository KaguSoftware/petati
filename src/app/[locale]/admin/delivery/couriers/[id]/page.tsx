import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckCircle2, Clock, Coins, Route, ShieldCheck, ShoppingBag, Truck, XCircle } from "lucide-react";
import { CashSheet } from "@/components/admin/delivery/cash-sheet";
import { CourierRowActions } from "@/components/admin/delivery/courier-row-actions";
import { DeliveryLogTable } from "@/components/admin/delivery/delivery-log-table";
import { DispatchTable } from "@/components/admin/delivery/dispatch-table";
import { SettlementsList } from "@/components/admin/delivery/settlements-list";
import { CrumbLabel } from "@/components/admin/shared/crumb-label";
import { EmptyState } from "@/components/admin/shared/empty-state";
import { KpiCard } from "@/components/admin/shared/kpi-card";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TabbedPanels } from "@/components/admin/shared/tabbed-panels";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/lib/admin/context";
import { getCourierSummary, listCashSheet, listCouriers, listDeliveries, listDeliveryEvents, listSettlements, storeToday } from "@/lib/admin/delivery/queries";
import { parseListParams } from "@/lib/admin/list-params";
import { can } from "@/lib/auth/permissions";
import { deliveryFromSettings } from "@/lib/delivery/settings";
import { formatMoney } from "@/lib/money";

type Props = PageProps<"/[locale]/admin/delivery/couriers/[id]">;

/** `[id]` has no static params, so the params read itself is runtime data: keep it under Suspense. */
export default function CourierPage({ params }: Props) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

/**
 * One courier, everything about them: today's run, the last stops, the cash they hold and the log
 * of what they did. Every courier name in the module links here, which is what turns "Ali" from a
 * string in a cell into a place you can go.
 */
async function Content({ params }: { params: Props["params"] }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const ctx = await requireAdminPage(locale, "delivery.read");
  const canManage = can(ctx.role, "delivery.manage");
  const canCash = can(ctx.role, "delivery.cash");
  const canAssign = can(ctx.role, "delivery.assign");
  const settings = deliveryFromSettings(ctx.store.settings);
  const today = storeToday(ctx.store.timezone);
  const tomorrow = storeToday(ctx.store.timezone, settings.leadDays);
  const history = parseListParams({}, { sorts: ["created_at"], pageSize: 50 });

  const [summary, todayRows, past, cash, settlements, log, couriers, t] = await Promise.all([
    getCourierSummary(ctx.store.id, id, ctx.store.timezone),
    listDeliveries(ctx.store.id, { courierId: id, from: today, to: today }),
    listDeliveries(ctx.store.id, { courierId: id, newestFirst: true, range: history.range }),
    canCash ? listCashSheet(ctx.store.id) : Promise.resolve([]),
    canCash ? listSettlements(ctx.store.id, 10, id) : Promise.resolve([]),
    listDeliveryEvents(ctx.store.id, { ...history, pageSize: 30, range: { from: 0, to: 29 } }, { courierId: id }),
    listCouriers(ctx.store.id, false),
    getTranslations("admin"),
  ]);
  if (!summary) notFound();
  const { courier } = summary;
  const money = (n: number) => formatMoney(n, ctx.store.currency, ctx.locale);
  const verifiedPct = summary.delivered > 0 ? Math.round((summary.verified / summary.delivered) * 100) : null;
  const courierOptions = couriers.map((c) => ({ id: c.id, name: c.name }));
  const shared = { storeId: ctx.store.id, locale: ctx.locale, canAssign, couriers: courierOptions, today, tomorrow, slots: settings.slots, codEnabled: settings.codEnabled, hideCourier: true };
  const myCash = cash.find((g) => g.courier.id === id);

  const panels = [
    { value: "today", label: t("delivery.courierPage.tabs.today"), count: todayRows.rows.length, content: <DispatchTable rows={todayRows.rows} bucket={`courier:${id}:today`} {...shared} /> },
    { value: "history", label: t("delivery.courierPage.tabs.history"), count: past.total, content: <DispatchTable rows={past.rows} bucket={`courier:${id}:history`} {...shared} noBulk /> },
    ...(canCash
      ? [
          {
            value: "cash",
            label: t("delivery.courierPage.tabs.cash"),
            count: myCash?.rows.length ?? 0,
            content: (
              <div className="flex flex-col gap-4">
                {myCash ? (
                  <CashSheet
                    storeId={ctx.store.id}
                    courier={{ id: courier.id, name: courier.name }}
                    rows={myCash.rows.map((r) => ({
                      id: r.id,
                      orderId: r.order_id,
                      orderNumber: r.order_number,
                      customer: r.customer_name,
                      expected: r.cash_expected,
                      collected: r.cash_collected ?? 0,
                      expectedLabel: money(r.cash_expected),
                      collectedLabel: money(r.cash_collected ?? 0),
                    }))}
                    expectedLabel={money(myCash.expected)}
                    collectedTotal={myCash.collected}
                    collectedLabel={money(myCash.collected)}
                    currency={ctx.store.currency}
                    hideCourier
                  />
                ) : (
                  <EmptyState title={t("delivery.courierPage.noCash")} />
                )}
                <SettlementsList rows={settlements} currency={ctx.store.currency} locale={ctx.locale} hideCourier />
              </div>
            ),
          },
        ]
      : []),
    {
      value: "log",
      label: t("delivery.courierPage.tabs.log"),
      count: log.total,
      content: (
        <div className="flex flex-col gap-3">
          <DeliveryLogTable rows={log.rows} locale={ctx.locale} hideCourier />
          {log.total > log.rows.length && (
            <Link href={`/admin/delivery/log?courier=${id}`} className={buttonVariants({ variant: "outline", size: "sm" }) + " self-start"}>
              {t("dashboard.viewAll")}
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <CrumbLabel segment={courier.id} label={courier.name} />
      <PageHeader
        back={{ href: canManage ? "/admin/delivery/couriers" : "/admin/delivery", label: canManage ? t("delivery.couriers.title") : t("nav.delivery") }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span>{courier.name}</span>
            {!courier.is_active && (
              <Badge variant="outline" className="text-sm font-normal">
                {t("delivery.courierPage.inactive")}
              </Badge>
            )}
          </span>
        }
        description={
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            {courier.vehicle && <span>{t(`delivery.vehicle.${courier.vehicle}`)}</span>}
            {courier.phone && (
              <a href={`tel:${courier.phone}`} dir="ltr" className="hover:underline">
                {courier.phone}
              </a>
            )}
            {courier.note && <span>{courier.note}</span>}
          </span>
        }
        actions={
          <>
            <Link href={`/admin/delivery/runs/${courier.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Route data-icon="inline-start" />
              {t("delivery.courierPage.runToday")}
            </Link>
            <Link href={`/admin/orders?courier=${courier.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <ShoppingBag data-icon="inline-start" />
              {t("delivery.courierPage.allOrders")}
            </Link>
            {canManage && (
              <CourierRowActions
                storeId={ctx.store.id}
                locale={ctx.locale}
                hasStops={courier.open_stops > 0}
                courier={{ id: courier.id, name: courier.name, phone: courier.phone, vehicle: courier.vehicle, note: courier.note, is_active: courier.is_active }}
                variant="button"
              />
            )}
          </>
        }
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-3">
        <KpiCard label={t("delivery.courierPage.kpi.open")} value={courier.open_stops} icon={Truck} href={`/admin/delivery/runs/${courier.id}`} />
        <KpiCard label={t("delivery.courierPage.kpi.delivered")} value={summary.delivered} icon={CheckCircle2} />
        <KpiCard label={t("delivery.courierPage.kpi.verified")} value={verifiedPct === null ? "—" : `${verifiedPct}%`} icon={ShieldCheck} />
        <KpiCard label={t("delivery.courierPage.kpi.failed")} value={summary.failed} icon={XCircle} tone={summary.failed > 0 ? "warning" : "default"} />
        <KpiCard label={t("delivery.courierPage.kpi.avgHours")} value={summary.avgHours === null ? "—" : t("delivery.stats.hours", { count: Math.round(summary.avgHours) })} icon={Clock} />
        {canCash && <KpiCard label={t("delivery.courierPage.kpi.cash")} value={money(courier.cash_held)} icon={Coins} tone={courier.cash_held > 0 ? "warning" : "default"} href={`/admin/delivery/cash#${courier.id}`} />}
      </div>

      <TabbedPanels label={t("common.status")} param="tab" defaultValue="today" panels={panels} />
    </>
  );
}
