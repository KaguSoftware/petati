import { Banknote, Boxes, Coins, HandCoins, Percent, ReceiptText, RotateCcw, TrendingUp, Truck, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ExpenseTotals, SalesSummary } from "@/lib/admin/finance/types";
import { formatMoney } from "@/lib/money";
import { KpiCard } from "../shared/kpi-card";
import { numberFormat } from "@/lib/number";

interface Props {
  summary: SalesSummary;
  expenses: ExpenseTotals;
  currency: string;
  locale: string;
  /** Courier cash: what is still in couriers' pockets, and what they handed over in the period. Null without delivery.cash. */
  courierCash: { outstanding: number; settled: number } | null;
}

/** KPI grid for the period: gross, paid, refunds, COGS, shipping cost, expenses, net, margin %, and courier cash. */
export async function FinanceOverview({ summary, expenses, currency, locale, courierCash }: Props) {
  const t = await getTranslations("admin.finance.kpi");
  const money = (n: number) => formatMoney(n, currency, locale);
  const { totals } = summary;
  const net = totals.paidGross - totals.refunds - totals.cogs - totals.shippingCost - expenses.total;
  const margin = totals.paidGross > 0 ? net / totals.paidGross : null;
  const pct = numberFormat(locale, { style: "percent", maximumFractionDigits: 1 });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label={t("gross")} value={money(totals.gross)} hint={t("orders", { count: totals.orders })} icon={TrendingUp} href="/admin/orders" />
      <KpiCard label={t("paidGross")} value={money(totals.paidGross)} hint={t("paidHint")} icon={Banknote} />
      <KpiCard label={t("refunds")} value={money(totals.refunds)} icon={RotateCcw} tone={totals.refunds > 0 ? "warning" : "default"} href="/admin/orders?status=refunded" />
      <KpiCard label={t("cogs")} value={money(totals.cogs)} hint={t("cogsHint")} icon={Boxes} />
      <KpiCard label={t("shippingCost")} value={money(totals.shippingCost)} hint={t("shippingCostHint")} icon={Truck} href="/admin/settings?tab=shipping" />
      <KpiCard label={t("expenses")} value={money(expenses.total)} hint={t("expensesHint", { count: expenses.rows.reduce((a, r) => a + r.count, 0) })} icon={ReceiptText} href="/admin/finance/expenses" />
      <KpiCard label={t("net")} value={money(net)} hint={t("netHint")} icon={Wallet} tone={net < 0 ? "danger" : "default"} className="xl:col-span-1" />
      <KpiCard label={t("margin")} value={margin == null ? "—" : pct.format(margin)} hint={margin == null ? t("noPaid") : t("marginHint")} icon={Percent} tone={margin != null && margin < 0 ? "danger" : "default"} />
      {courierCash && (
        <>
          <KpiCard label={t("courierCash")} value={money(courierCash.outstanding)} hint={t("courierCashHint")} icon={Coins} tone={courierCash.outstanding > 0 ? "warning" : "default"} href="/admin/delivery/cash" />
          <KpiCard label={t("cashSettled")} value={money(courierCash.settled)} hint={t("cashSettledHint")} icon={HandCoins} href="/admin/delivery/log?type=settled" />
        </>
      )}
    </div>
  );
}
