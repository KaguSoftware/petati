import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/admin/shared/page-header";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { EmptyState } from "@/components/admin/shared/empty-state";
import { CashSheet } from "@/components/admin/delivery/cash-sheet";
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
  const date = new Intl.DateTimeFormat(ctx.locale, { dateStyle: "medium", timeStyle: "short" });

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

      {settlements.length > 0 && (
        <section className="flex flex-col gap-2 rounded-xl border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">{t("history")}</h2>
          <ul className="divide-y text-sm">
            {settlements.map((s) => (
              <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                <span>{s.courier_name ?? "—"}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{date.format(new Date(s.created_at))}</span>
                <span className="font-medium tabular-nums">{money(s.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
