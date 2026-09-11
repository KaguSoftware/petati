import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DeliveryToday, KpiGrid, LowStockList, RecentOrders, SalesBars } from "@/components/admin/dashboard/dashboard-widgets";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { requireAdminPage } from "@/lib/admin/context";
import { getDashboard } from "@/lib/admin/dashboard/queries";
import { can } from "@/lib/auth/permissions";

export default async function AdminDashboard({ params }: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  return (
    <>
      <PageHeader title={t("nav.dashboard")} description={t("dashboard.subtitle")} />
      <Suspense fallback={<TableSkeleton />}>
        <Content locale={locale} />
      </Suspense>
    </>
  );
}

async function Content({ locale }: { locale: string }) {
  const ctx = await requireAdminPage(locale, "orders.read");
  const data = await getDashboard(ctx.store.id, {
    currency: ctx.store.currency,
    locale: ctx.locale,
    fallback: ctx.store.default_locale,
    finance: can(ctx.role, "finance.read"),
    delivery: can(ctx.role, "delivery.read"),
    timezone: ctx.store.timezone,
  });
  return (
    <>
      <KpiGrid data={data} locale={ctx.locale} />
      <DeliveryToday data={data} locale={ctx.locale} canCash={can(ctx.role, "delivery.cash")} />
      <SalesBars data={data} locale={ctx.locale} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentOrders data={data} locale={ctx.locale} />
        <LowStockList data={data} />
      </div>
    </>
  );
}
