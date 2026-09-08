import { History } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { StockRow, StockSort } from "@/lib/admin/inventory/types";
import { cn } from "@/lib/utils";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";
import { SortHeader } from "../shared/sort-header";
import { StatusBadge } from "../shared/status-badge";
import { AdjustStockDialog } from "./adjust-stock-dialog";
import { TrackingSwitch } from "./stock-controls";

interface Props {
  rows: StockRow[];
  storeId: string;
  locale: string;
  canAdjust: boolean;
  canWrite: boolean;
  sort: { sort: StockSort; dir: "asc" | "desc" };
  query: Record<string, string | undefined>;
  lowOnly: boolean;
}

export async function StockTable({ rows, storeId, locale, canAdjust, canWrite, sort, query, lowOnly }: Props) {
  const t = await getTranslations("admin");
  const num = new Intl.NumberFormat(locale);
  const basePath = "/admin/inventory";
  const columns: Column<StockRow>[] = [
    {
      key: "product",
      header: t("inventory.product"),
      cell: (r) => (
        <div className="flex min-w-0 flex-col">
          <Link href={`/admin/products/${r.productId}`} className={cn("truncate font-medium hover:underline", !r.is_active && "text-muted-foreground line-through")}>
            {r.productName || "—"}
          </Link>
          {r.variantLabel && <span className="truncate text-xs text-muted-foreground">{r.variantLabel}</span>}
        </div>
      ),
    },
    {
      key: "sku",
      header: <SortHeader label={t("inventory.sku")} sortKey="sku" current={sort} basePath={basePath} query={query} />,
      cell: (r) => (
        <span className="text-muted-foreground tabular-nums" dir="ltr">
          {r.sku ?? "—"}
        </span>
      ),
      hideBelow: "md",
    },
    {
      key: "stock",
      header: <SortHeader label={t("inventory.stock")} sortKey="stock_qty" current={sort} basePath={basePath} query={query} className="justify-end" />,
      cell: (r) => (
        <span className={cn("font-medium tabular-nums", r.level === "out" && "text-destructive", r.level === "low" && "text-amber-700 dark:text-amber-300")}>{num.format(r.stock_qty)}</span>
      ),
      className: "text-end",
    },
    { key: "level", header: t("common.status"), cell: (r) => (r.track_inventory ? <StatusBadge kind="stock" value={r.level} /> : <span className="text-xs text-muted-foreground">{t("inventory.untracked")}</span>) },
    { key: "threshold", header: t("inventory.threshold"), cell: (r) => <span className="text-muted-foreground tabular-nums">{num.format(r.threshold)}</span>, className: "text-end", hideBelow: "lg" },
    {
      key: "tracking",
      header: t("inventory.tracking"),
      cell: (r) => <TrackingSwitch storeId={storeId} variantId={r.variantId} field="track_inventory" checked={r.track_inventory} disabled={!canWrite} />,
      className: "text-center",
      hideBelow: "lg",
    },
    {
      key: "backorder",
      header: t("inventory.backorder"),
      cell: (r) => <TrackingSwitch storeId={storeId} variantId={r.variantId} field="allow_backorder" checked={r.allow_backorder} disabled={!canWrite} />,
      className: "text-center",
      hideBelow: "xl",
    },
    {
      key: "actions",
      header: <span className="sr-only">{t("common.actions")}</span>,
      cell: (r) => (
        <div className="flex items-center justify-end gap-0.5">
          <Link href={`/admin/inventory/movements?variant=${r.variantId}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={t("inventory.history")}>
            <History />
          </Link>
          {canAdjust && (
            <AdjustStockDialog storeId={storeId} variantId={r.variantId} productName={r.productName} variantLabel={r.variantLabel} sku={r.sku} currentQty={r.stock_qty} locale={locale} compact />
          )}
        </div>
      ),
      className: "w-20 text-end",
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.variantId}
      empty={
        <EmptyState
          title={lowOnly ? t("inventory.allGood") : t("common.noResults")}
          description={lowOnly ? t("inventory.allGoodHint") : t("common.noResultsHint")}
          action={
            lowOnly ? (
              <Link href="/admin/inventory" className={buttonVariants({ variant: "outline", size: "sm" })}>
                {t("inventory.showAll")}
              </Link>
            ) : (
              <Link href="/admin/products/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
                {t("products.new")}
              </Link>
            )
          }
        />
      }
    />
  );
}
