import { AlertTriangle, CheckCircle2, CalendarClock, Coins, Truck, XCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { KpiCard } from "@/components/admin/shared/kpi-card";
import type { DeliveryKpis } from "@/lib/admin/delivery/types";
import { formatMoney } from "@/lib/money";

/** The dispatcher's glance: what is moving, what is stuck, and what money is out there. Every card opens its bucket. */
export async function DeliveryKpiRow({ kpis, currency, locale, canCash }: { kpis: DeliveryKpis; currency: string; locale: string; canCash: boolean }) {
  const t = await getTranslations("admin.delivery.kpi");
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-3">
      <KpiCard label={t("out")} value={kpis.outForDelivery} icon={Truck} href="/admin/delivery?bucket=out_for_delivery" />
      <KpiCard label={t("scheduled")} value={kpis.scheduledToday} icon={CalendarClock} href="/admin/delivery/runs" />
      <KpiCard label={t("delivered")} value={kpis.deliveredToday} icon={CheckCircle2} href="/admin/delivery?bucket=done" />
      <KpiCard label={t("failed")} value={kpis.failedToday} icon={XCircle} tone={kpis.failedToday > 0 ? "warning" : "default"} href="/admin/delivery?bucket=failed" />
      <KpiCard label={t("unverified")} value={kpis.unverified} icon={AlertTriangle} tone={kpis.unverified > 0 ? "warning" : "default"} href="/admin/delivery?bucket=unverified" />
      <KpiCard label={t("cash")} value={formatMoney(kpis.cashOutstanding, currency, locale)} icon={Coins} href={canCash ? "/admin/delivery/cash" : undefined} />
    </div>
  );
}
