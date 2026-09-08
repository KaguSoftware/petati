import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { couponStatus, type CouponSort } from "@/lib/admin/coupons/types";
import type { CouponRow } from "@/lib/db/types";
import { formatMoney } from "@/lib/money";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";
import { SortHeader } from "../shared/sort-header";
import { StatusBadge } from "../shared/status-badge";
import { CouponActiveSwitch, CouponRowActions } from "./coupon-row-actions";

interface Props {
  rows: CouponRow[];
  storeId: string;
  locale: string;
  currency: string;
  /** Read once by the page (after its runtime reads) so status derivation is deterministic per render. */
  now: Date;
  sort: { sort: CouponSort; dir: "asc" | "desc" };
  query: Record<string, string | undefined>;
  emptyAction?: React.ReactNode;
}

export async function CouponsTable({ rows, storeId, locale, currency, now, sort, query, emptyAction }: Props) {
  const t = await getTranslations("admin.coupons");
  const tt = await getTranslations("admin.discountType");
  const tc = await getTranslations("admin.common");
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const num = new Intl.NumberFormat(locale);
  const basePath = "/admin/coupons";

  const valueLabel = (c: CouponRow) =>
    c.type === "percent" ? t("percentValue", { value: num.format(c.value) }) : c.type === "fixed" ? formatMoney(c.value, currency, locale) : tt("free_shipping");
  const windowLabel = (c: CouponRow) => {
    const from = c.starts_at ? date.format(new Date(c.starts_at)) : null;
    const to = c.ends_at ? date.format(new Date(c.ends_at)) : null;
    if (from && to) return t("between", { from, to });
    if (from) return t("from", { date: from });
    if (to) return t("until", { date: to });
    return t("always");
  };

  const columns: Column<CouponRow>[] = [
    {
      key: "code",
      header: <SortHeader label={t("code")} sortKey="code" current={sort} basePath={basePath} query={query} />,
      cell: (c) => (
        <Link href={`/admin/coupons/${c.id}`} className="font-mono text-sm font-medium tracking-wide uppercase hover:underline" dir="ltr">
          {c.code}
        </Link>
      ),
    },
    {
      key: "value",
      header: t("value"),
      cell: (c) => (
        <div className="flex min-w-0 flex-col">
          <span className="tabular-nums">{valueLabel(c)}</span>
          {c.type !== "free_shipping" && <span className="text-xs text-muted-foreground">{tt(c.type)}</span>}
        </div>
      ),
    },
    {
      key: "min",
      header: t("minSubtotal"),
      cell: (c) => <span className="text-muted-foreground tabular-nums">{c.min_subtotal ? formatMoney(c.min_subtotal, currency, locale) : "—"}</span>,
      hideBelow: "lg",
    },
    {
      key: "uses",
      header: <SortHeader label={t("uses")} sortKey="uses_count" current={sort} basePath={basePath} query={query} className="justify-end" />,
      cell: (c) => (
        <span className="tabular-nums" dir="ltr">
          {num.format(c.uses_count)} / {c.max_uses == null ? t("unlimited") : num.format(c.max_uses)}
        </span>
      ),
      className: "text-end",
      hideBelow: "md",
    },
    {
      key: "window",
      header: <SortHeader label={t("window")} sortKey="ends_at" current={sort} basePath={basePath} query={query} />,
      cell: (c) => <span className="text-muted-foreground tabular-nums">{windowLabel(c)}</span>,
      hideBelow: "lg",
    },
    { key: "status", header: tc("status"), cell: (c) => <StatusBadge kind="coupon" value={couponStatus(c, now)} />, hideBelow: "sm" },
    { key: "active", header: t("active"), cell: (c) => <CouponActiveSwitch storeId={storeId} coupon={c} />, className: "w-14" },
    { key: "actions", header: <span className="sr-only">{tc("actions")}</span>, cell: (c) => <CouponRowActions storeId={storeId} currency={currency} coupon={c} />, className: "w-20 pe-2 text-end sm:w-28" },
  ];
  return <DataTable columns={columns} rows={rows} rowKey={(c) => c.id} empty={<EmptyState title={tc("noResults")} description={tc("noResultsHint")} action={emptyAction} />} />;
}
