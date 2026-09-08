import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DataTable, type Column } from "@/components/admin/shared/data-table";
import { EmptyState } from "@/components/admin/shared/empty-state";
import { KpiCard } from "@/components/admin/shared/kpi-card";
import { PageHeader } from "@/components/admin/shared/page-header";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { TableSkeleton } from "@/components/admin/shared/table-skeleton";
import { Link } from "@/i18n/navigation";
import { requireAdminPage } from "@/lib/admin/context";
import { getCouponWithRedemptions } from "@/lib/admin/coupons/queries";
import { couponStatus, type CouponRedemptionDetail } from "@/lib/admin/coupons/types";
import { formatMoney } from "@/lib/money";

type Props = PageProps<"/[locale]/admin/coupons/[id]">;

/** `[id]` has no static params, so the params read itself is runtime data: keep it under Suspense. */
export default function CouponUsagePage({ params }: Props) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Props["params"] }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const ctx = await requireAdminPage(locale, "coupons.manage");
  const [coupon, t, tt] = await Promise.all([getCouponWithRedemptions(ctx.store.id, id), getTranslations("admin"), getTranslations("admin.discountType")]);
  if (!coupon) notFound();
  const now = new Date(); // after the runtime reads above (Cache Components)
  const currency = ctx.store.currency;
  const money = (n: number) => formatMoney(n, currency, ctx.locale);
  const date = new Intl.DateTimeFormat(ctx.locale, { dateStyle: "medium", timeStyle: "short" });
  const num = new Intl.NumberFormat(ctx.locale);
  const redemptions = coupon.coupon_redemptions;
  const totalDiscount = redemptions.reduce((sum, r) => sum + r.amount, 0);
  const valueLabel =
    coupon.type === "percent" ? t("coupons.percentValue", { value: num.format(coupon.value) }) : coupon.type === "fixed" ? money(coupon.value) : tt("free_shipping");

  const columns: Column<CouponRedemptionDetail>[] = [
    {
      key: "order",
      header: t("coupons.usagePage.order"),
      cell: (r) =>
        r.orders ? (
          <Link href={`/admin/orders/${r.orders.id}`} className="font-medium tabular-nums hover:underline" dir="ltr">
            {r.orders.number}
          </Link>
        ) : (
          "—"
        ),
    },
    {
      key: "customer",
      header: t("coupons.usagePage.customer"),
      cell: (r) => (
        <div className="flex min-w-0 flex-col">
          {r.customers ? (
            <Link href={`/admin/customers/${r.customers.id}`} className="truncate hover:underline">
              {r.customers.full_name ?? r.customers.email}
            </Link>
          ) : (
            <span className="truncate">{r.orders?.email ?? "—"}</span>
          )}
          <span className="truncate text-xs text-muted-foreground" dir="ltr">
            {r.customers?.email ?? r.orders?.email ?? ""}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      header: t("coupons.usagePage.amount"),
      cell: (r) => <span className="font-medium tabular-nums">−{formatMoney(r.amount, r.orders?.currency ?? currency, ctx.locale)}</span>,
      className: "text-end",
    },
    {
      key: "date",
      header: t("coupons.usagePage.date"),
      cell: (r) => <span className="text-muted-foreground tabular-nums">{date.format(new Date(r.created_at))}</span>,
      hideBelow: "md",
    },
  ];

  return (
    <>
      <PageHeader
        back={{ href: "/admin/coupons", label: t("nav.coupons") }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono uppercase" dir="ltr">
              {coupon.code}
            </span>
            <StatusBadge kind="coupon" value={couponStatus(coupon, now)} className="text-sm" />
          </span>
        }
        description={`${t("coupons.usagePage.title")} · ${tt(coupon.type)} · ${valueLabel}`}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label={t("coupons.uses")} value={<span dir="ltr">{`${num.format(coupon.uses_count)} / ${coupon.max_uses == null ? t("coupons.unlimited") : num.format(coupon.max_uses)}`}</span>} />
        <KpiCard label={t("coupons.usagePage.totalDiscount")} value={money(totalDiscount)} />
        <KpiCard label={t("coupons.minSubtotal")} value={coupon.min_subtotal ? money(coupon.min_subtotal) : "—"} />
      </div>
      <p className="text-sm text-muted-foreground">{t("coupons.usagePage.summary", { count: redemptions.length })}</p>
      <DataTable columns={columns} rows={redemptions} rowKey={(r) => r.id} empty={<EmptyState title={t("coupons.usagePage.empty")} />} />
    </>
  );
}
