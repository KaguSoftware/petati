import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { MovementRow } from "@/lib/admin/inventory/types";
import { cn } from "@/lib/utils";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";
import { dateTimeFormat, numberFormat } from "@/lib/number";

interface Props {
  rows: MovementRow[];
  locale: string;
}

const REASON_TONE: Record<MovementRow["reason"], string> = {
  initial: "bg-muted text-muted-foreground",
  purchase: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  sale: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  return: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  adjustment: "bg-muted text-muted-foreground",
  damaged: "bg-destructive/10 text-destructive",
  correction: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
};

export async function MovementsTable({ rows, locale }: Props) {
  const t = await getTranslations("admin");
  const date = dateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const num = numberFormat(locale, { signDisplay: "always" });
  const columns: Column<MovementRow>[] = [
    { key: "date", header: t("common.date"), cell: (r) => <span className="text-muted-foreground tabular-nums whitespace-nowrap">{date.format(new Date(r.created_at))}</span> },
    {
      key: "product",
      header: t("inventory.product"),
      cell: (r) => (
        <div className="flex min-w-0 flex-col">
          <Link href={`/admin/products/${r.productId}`} className="truncate font-medium hover:underline">
            {r.productName || "—"}
          </Link>
          <span className="truncate text-xs text-muted-foreground">
            {r.variantLabel}
            {r.sku && (
              <span className="mx-1" dir="ltr">
                {r.sku}
              </span>
            )}
          </span>
        </div>
      ),
    },
    {
      key: "delta",
      header: t("inventory.delta"),
      cell: (r) => <span className={cn("font-semibold tabular-nums", r.delta > 0 ? "text-emerald-700 dark:text-emerald-300" : "text-destructive")}>{num.format(r.delta)}</span>,
      className: "text-end",
    },
    {
      key: "reason",
      header: t("inventory.reason"),
      cell: (r) => <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", REASON_TONE[r.reason])}>{t(`stockReason.${r.reason}`)}</span>,
    },
    { key: "actor", header: t("inventory.actor"), cell: (r) => <span className="text-muted-foreground">{r.actorName ?? t("inventory.system")}</span>, hideBelow: "md" },
    {
      key: "order",
      header: t("inventory.order"),
      cell: (r) =>
        r.orderId ? (
          <Link href={`/admin/orders/${r.orderId}`} className="tabular-nums hover:underline" dir="ltr">
            {r.orderNumber ?? "…"}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      hideBelow: "lg",
    },
    { key: "note", header: t("inventory.note"), cell: (r) => <span className="line-clamp-2 text-muted-foreground">{r.note ?? ""}</span>, hideBelow: "xl" },
  ];
  return <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} empty={<EmptyState title={t("inventory.noMovements")} description={t("inventory.noMovementsHint")} />} />;
}
