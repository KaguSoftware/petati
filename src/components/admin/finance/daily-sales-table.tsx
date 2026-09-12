import { getTranslations } from "next-intl/server";
import type { DailySalesRow } from "@/lib/admin/finance/types";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";
import { dateTimeFormat, numberFormat } from "@/lib/number";

interface Props {
  rows: DailySalesRow[];
  currency: string;
  locale: string;
}

/** Inline CSS bar (fills from the inline start, so it mirrors under RTL). */
function Bar({ value, max, tone = "primary" }: { value: number; max: number; tone?: "primary" | "muted" | "danger" }) {
  const width = max > 0 ? Math.max(value > 0 ? 3 : 0, (value / max) * 100) : 0;
  return (
    <span aria-hidden className="hidden h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted sm:block">
      <span className={cn("block h-full rounded-full", tone === "primary" && "bg-primary/70", tone === "muted" && "bg-foreground/30", tone === "danger" && "bg-destructive/60")} style={{ width: `${width}%` }} />
    </span>
  );
}

/** Day-by-day sales for the period, newest first, with bars for paid revenue, orders and refunds. */
export async function DailySalesTable({ rows, currency, locale }: Props) {
  const t = await getTranslations("admin.finance.dailySales");
  const money = (n: number) => formatMoney(n, currency, locale);
  const num = numberFormat(locale);
  const date = dateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" });
  const sorted = [...rows].sort((a, b) => (a.day < b.day ? 1 : -1));
  const maxPaid = Math.max(0, ...rows.map((r) => r.paid_gross));
  const maxOrders = Math.max(0, ...rows.map((r) => r.orders_count));
  const maxRefunds = Math.max(0, ...rows.map((r) => r.refunds));

  const columns: Column<DailySalesRow>[] = [
    { key: "day", header: t("day"), cell: (r) => <span className="font-medium tabular-nums">{date.format(new Date(`${r.day}T00:00:00`))}</span> },
    {
      key: "orders",
      header: t("orders"),
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Bar value={r.orders_count} max={maxOrders} tone="muted" />
          <span className="tabular-nums">{num.format(r.orders_count)}</span>
        </div>
      ),
    },
    { key: "gross", header: t("gross"), cell: (r) => <span className="text-muted-foreground tabular-nums">{money(r.gross)}</span>, className: "text-end", hideBelow: "md" },
    {
      key: "paid",
      header: t("paidGross"),
      cell: (r) => (
        <div className="flex items-center justify-end gap-2">
          <Bar value={r.paid_gross} max={maxPaid} />
          <span className="font-medium tabular-nums">{money(r.paid_gross)}</span>
        </div>
      ),
      className: "text-end",
    },
    {
      key: "refunds",
      header: t("refunds"),
      cell: (r) => (
        <div className="flex items-center justify-end gap-2">
          <Bar value={r.refunds} max={maxRefunds} tone="danger" />
          <span className={cn("tabular-nums", r.refunds > 0 ? "text-destructive" : "text-muted-foreground")}>{money(r.refunds)}</span>
        </div>
      ),
      className: "text-end",
      hideBelow: "sm",
    },
    { key: "cogs", header: t("cogs"), cell: (r) => <span className="text-muted-foreground tabular-nums">{money(r.cogs)}</span>, className: "text-end", hideBelow: "lg" },
    { key: "shipping_cost", header: t("shippingCost"), cell: (r) => <span className="text-muted-foreground tabular-nums">{money(r.shipping_cost)}</span>, className: "text-end", hideBelow: "lg" },
  ];

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">{t("title")}</h2>
      <DataTable columns={columns} rows={sorted} rowKey={(r) => r.day} empty={<EmptyState title={t("empty")} className="py-10" />} />
    </section>
  );
}
