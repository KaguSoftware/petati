import { Banknote, Boxes, Percent, ReceiptText, RotateCcw, TrendingUp, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ExpenseTotals, SalesSummary } from "@/lib/admin/finance/types";
import { formatMoney } from "@/lib/money";
import { KpiCard } from "../shared/kpi-card";

interface Props {
  summary: SalesSummary;
  expenses: ExpenseTotals;
  currency: string;
  locale: string;
}

/** KPI grid for the period: gross, paid, refunds, COGS, expenses, net and margin %. */
export async function FinanceOverview({ summary, expenses, currency, locale }: Props) {
  const t = await getTranslations("admin.finance.kpi");
  const money = (n: number) => formatMoney(n, currency, locale);
  const { totals } = summary;
  const net = totals.paidGross - totals.refunds - totals.cogs - expenses.total;
  const margin = totals.paidGross > 0 ? net / totals.paidGross : null;
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label={t("gross")} value={money(totals.gross)} hint={t("orders", { count: totals.orders })} icon={TrendingUp} />
      <KpiCard label={t("paidGross")} value={money(totals.paidGross)} hint={t("paidHint")} icon={Banknote} />
      <KpiCard label={t("refunds")} value={money(totals.refunds)} icon={RotateCcw} tone={totals.refunds > 0 ? "warning" : "default"} />
      <KpiCard label={t("cogs")} value={money(totals.cogs)} hint={t("cogsHint")} icon={Boxes} />
      <KpiCard label={t("expenses")} value={money(expenses.total)} hint={t("expensesHint", { count: expenses.rows.reduce((a, r) => a + r.count, 0) })} icon={ReceiptText} />
      <KpiCard label={t("net")} value={money(net)} hint={t("netHint")} icon={Wallet} tone={net < 0 ? "danger" : "default"} className="xl:col-span-1" />
      <KpiCard label={t("margin")} value={margin == null ? "—" : pct.format(margin)} hint={margin == null ? t("noPaid") : t("marginHint")} icon={Percent} tone={margin != null && margin < 0 ? "danger" : "default"} />
    </div>
  );
}
