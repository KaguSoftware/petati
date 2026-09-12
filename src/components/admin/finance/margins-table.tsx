import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ProductMarginRow } from "@/lib/admin/finance/types";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";
import { numberFormat } from "@/lib/number";

interface Props {
  rows: ProductMarginRow[];
  currency: string;
  locale: string;
}

/** Top products by gross margin (all-time; see getProductMargins SCOPE note). */
export async function MarginsTable({ rows, currency, locale }: Props) {
  const t = await getTranslations("admin.finance.margins");
  const money = (n: number) => formatMoney(n, currency, locale);
  const num = numberFormat(locale);
  const pct = numberFormat(locale, { style: "percent", maximumFractionDigits: 1 });

  const columns: Column<ProductMarginRow>[] = [
    {
      key: "product",
      header: t("product"),
      cell: (r) => (
        <div className="flex min-w-0 flex-col">
          {r.product_id ? (
            <Link href={`/admin/products/${r.product_id}`} className="truncate font-medium hover:underline">
              {r.product_name || "—"}
            </Link>
          ) : (
            <span className="truncate font-medium">{r.product_name || "—"}</span>
          )}
          {r.sku && (
            <span className="truncate text-xs text-muted-foreground" dir="ltr">
              {r.sku}
            </span>
          )}
        </div>
      ),
    },
    { key: "units", header: t("units"), cell: (r) => <span className="tabular-nums">{num.format(r.units_sold)}</span>, className: "text-end" },
    { key: "revenue", header: t("revenue"), cell: (r) => <span className="tabular-nums">{money(r.revenue)}</span>, className: "text-end", hideBelow: "md" },
    { key: "cogs", header: t("cogs"), cell: (r) => <span className="text-muted-foreground tabular-nums">{money(r.cogs)}</span>, className: "text-end", hideBelow: "lg" },
    { key: "margin", header: t("margin"), cell: (r) => <span className={cn("font-medium tabular-nums", r.gross_margin < 0 && "text-destructive")}>{money(r.gross_margin)}</span>, className: "text-end" },
    {
      key: "pct",
      header: t("marginPct"),
      cell: (r) => <span className="text-muted-foreground tabular-nums">{r.revenue > 0 ? pct.format(r.gross_margin / r.revenue) : "—"}</span>,
      className: "text-end",
      hideBelow: "sm",
    },
  ];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">{t("title")}</h2>
        <span className="text-xs text-muted-foreground">{t("allTime")}</span>
      </div>
      <DataTable columns={columns} rows={rows} rowKey={(r) => `${r.product_id ?? "p"}:${r.variant_id ?? "v"}:${r.sku ?? ""}`} empty={<EmptyState title={t("empty")} className="py-10" />} />
    </section>
  );
}
