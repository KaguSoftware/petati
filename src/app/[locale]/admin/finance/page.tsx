import { ReceiptText } from "lucide-react";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DailySalesTable } from "@/components/admin/finance/daily-sales-table";
import { ExpensesByCategory } from "@/components/admin/finance/expenses-by-category";
import { FinanceOverview } from "@/components/admin/finance/finance-overview";
import { MarginsTable } from "@/components/admin/finance/margins-table";
import { DateRangePicker } from "@/components/admin/shared/date-range-picker";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { TableToolbar } from "@/components/admin/shared/table-toolbar";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/lib/admin/context";
import { getDeliveryKpis, sumSettlements } from "@/lib/admin/delivery/queries";
import { getExpenseTotals, getProductMargins, getSalesSummary, resolveDateRange } from "@/lib/admin/finance/queries";
import { can } from "@/lib/auth/permissions";
import type { SearchParams } from "@/lib/admin/list-params";

type Props = PageProps<"/[locale]/admin/finance">;

export default async function FinancePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  return (
    <>
      <PageHeader title={t("nav.finance")} description={t("finance.subtitle")} />
      <Suspense fallback={<TableSkeleton />}>
        <Content locale={locale} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Content({ locale, searchParams }: { locale: string; searchParams: Props["searchParams"] }) {
  const ctx = await requireAdminPage(locale, "finance.read");
  const sp = (await searchParams) as SearchParams;
  const { from, to } = resolveDateRange(sp);
  const canCash = can(ctx.role, "delivery.cash");
  const [summary, expenses, margins, deliveryKpis, settled, t] = await Promise.all([
    getSalesSummary(ctx.store.id, from, to),
    getExpenseTotals(ctx.store.id, from, to),
    getProductMargins(ctx.store.id, { limit: 20 }),
    canCash ? getDeliveryKpis(ctx.store.id, ctx.store.timezone) : Promise.resolve(null),
    canCash ? sumSettlements(ctx.store.id, from, to) : Promise.resolve(null),
    getTranslations("admin.finance"),
  ]);
  const fmt = new Intl.DateTimeFormat(ctx.locale, { dateStyle: "medium" });
  const period = `${fmt.format(new Date(`${from}T00:00:00`))} – ${fmt.format(new Date(`${to}T00:00:00`))}`;
  const currency = ctx.store.currency;

  return (
    <>
      <TableToolbar
        actions={
          <Link href="/admin/finance/expenses" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ReceiptText data-icon="inline-start" />
            {t("manageExpenses")}
          </Link>
        }
      >
        <DateRangePicker />
        <span className="text-sm text-muted-foreground tabular-nums">{t("period", { period })}</span>
      </TableToolbar>
      <FinanceOverview summary={summary} expenses={expenses} currency={currency} locale={ctx.locale} courierCash={deliveryKpis && settled !== null ? { outstanding: deliveryKpis.cashOutstanding, settled } : null} />
      <DailySalesTable rows={summary.rows} currency={currency} locale={ctx.locale} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <MarginsTable rows={margins} currency={currency} locale={ctx.locale} />
        <ExpensesByCategory data={expenses} currency={currency} locale={ctx.locale} />
      </div>
    </>
  );
}
