import { AlertTriangle, CheckCircle2, CalendarClock, Coins, Truck, XCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { KpiCard } from "@/components/admin/shared/kpi-card";
import type { DeliveryKpis } from "@/lib/admin/delivery/types";
import { formatMoney } from "@/lib/money";

/** The dispatcher's glance: what is moving, what is stuck, and what money is out there. */
export async function DeliveryKpiRow({ kpis, currency, locale }: { kpis: DeliveryKpis; currency: string; locale: string }) {
  const t = await getTranslations("admin.delivery.kpi");
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-3">
      <KpiCard label={t("out")} value={kpis.outForDelivery} icon={Truck} />
      <KpiCard label={t("scheduled")} value={kpis.scheduledToday} icon={CalendarClock} />
      <KpiCard label={t("delivered")} value={kpis.deliveredToday} icon={CheckCircle2} />
      <KpiCard label={t("failed")} value={kpis.failedToday} icon={XCircle} tone={kpis.failedToday > 0 ? "warning" : "default"} />
      <KpiCard label={t("unverified")} value={kpis.unverified} icon={AlertTriangle} tone={kpis.unverified > 0 ? "warning" : "default"} />
      <KpiCard label={t("cash")} value={formatMoney(kpis.cashOutstanding, currency, locale)} icon={Coins} />
    </div>
  );
}
