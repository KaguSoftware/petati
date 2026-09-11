import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { CustomerDeliverySummary } from "@/lib/admin/customers/queries";
import { formatMoney } from "@/lib/money";
import { EntityLink } from "../shared/entity-link";
import { StatusBadge } from "../shared/status-badge";

interface Props {
  summary: CustomerDeliverySummary;
  currency: string;
  locale: string;
  /** Link target for the customer's orders filtered by delivery trouble. */
  customerId: string;
}

/** The customer's delivery record in five numbers, each a way into the module. */
export async function CustomerDeliveryCard({ summary, currency, locale, customerId }: Props) {
  const t = await getTranslations("admin.customers.delivery");
  if (summary.stops === 0) return <p className="text-sm text-muted-foreground">{t("none")}</p>;
  const cell = "flex items-baseline justify-between gap-3 py-1.5";
  return (
    <div className="flex flex-col divide-y text-sm">
      <div className={cell}>
        <span className="text-muted-foreground">{t("last")}</span>
        <span className="flex items-center gap-2">
          {summary.lastState && <StatusBadge kind="delivery" value={summary.lastState} />}
          {summary.lastCourier && <EntityLink kind="courier" id={summary.lastCourier.id} label={summary.lastCourier.name} />}
        </span>
      </div>
      <div className={cell}>
        <span className="text-muted-foreground">{t("stops")}</span>
        <span className="tabular-nums">
          {summary.stops} · {t("deliveredCount", { count: summary.delivered })}
        </span>
      </div>
      <div className={cell}>
        <span className="text-muted-foreground">{t("failed")}</span>
        <span className={`tabular-nums ${summary.failed > 0 ? "font-medium text-destructive" : ""}`}>{summary.failed}</span>
      </div>
      <div className={cell}>
        <span className="text-muted-foreground">{t("unverified")}</span>
        <Link href="/admin/delivery?bucket=unverified" className={`tabular-nums underline-offset-4 hover:underline ${summary.unverified > 0 ? "font-medium text-amber-700 dark:text-amber-300" : ""}`}>
          {summary.unverified}
        </Link>
      </div>
      <div className={cell}>
        <span className="text-muted-foreground">{t("cashOpen")}</span>
        <span className="tabular-nums">{summary.cashOpen > 0 ? formatMoney(summary.cashOpen, currency, locale) : "—"}</span>
      </div>
      <div className="pt-2 text-xs">
        <Link href={`/admin/orders?customer=${customerId}`} className="text-muted-foreground underline-offset-4 hover:underline">
          {t("allOrders")}
        </Link>
      </div>
    </div>
  );
}
