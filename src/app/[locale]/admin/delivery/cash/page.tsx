import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { EmptyState } from "@/components/admin/shared/empty-state";
import { CashSheet } from "@/components/admin/delivery/cash-sheet";
import { SettlementsList } from "@/components/admin/delivery/settlements-list";
import { requireAdminPage } from "@/lib/admin/context";
import { listCashSheet, listSettlements } from "@/lib/admin/delivery/queries";
import { formatMoney } from "@/lib/money";

type Props = PageProps<"/[locale]/admin/delivery/cash">;

export default async function CashPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  return (
    <>
      <PageHeader back={{ href: "/admin/delivery", label: t("nav.delivery") }} title={t("delivery.cash.title")} description={t("delivery.cash.subtitle")} />
      <Suspense fallback={<TableSkeleton />}>
        <Content locale={locale} />
      </Suspense>
    </>
  );
}

async function Content({ locale }: { locale: string }) {
  const ctx = await requireAdminPage(locale, "delivery.cash");
  const [groups, settlements, t] = await Promise.all([listCashSheet(ctx.store.id), listSettlements(ctx.store.id), getTranslations("admin.delivery.cash")]);
  const money = (n: number) => formatMoney(n, ctx.store.currency, ctx.locale);

  return (
    <div className="flex flex-col gap-6">
      {groups.length === 0 ? (
        <EmptyState title={t("none")} />
      ) : (
        groups.map((group) => (
          <CashSheet
            key={group.courier.id}
            storeId={ctx.store.id}
            courier={{ id: group.courier.id, name: group.courier.name }}
            rows={group.rows.map((r) => ({
              id: r.id,
              orderId: r.order_id,
              orderNumber: r.order_number,
              customer: r.customer_name,
              expected: r.cash_expected,
              collected: r.cash_collected ?? 0,
              expectedLabel: money(r.cash_expected),
              collectedLabel: money(r.cash_collected ?? 0),
            }))}
            expectedLabel={money(group.expected)}
            collectedTotal={group.collected}
            collectedLabel={money(group.collected)}
            currency={ctx.store.currency}
          />
        ))
      )}
      <SettlementsList rows={settlements} currency={ctx.store.currency} locale={ctx.locale} />
    </div>
  );
}
