import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { OrderListRow, OrderSort } from "@/lib/admin/orders/queries";
import { formatMoney } from "@/lib/money";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";
import { SortHeader } from "../shared/sort-header";
import { StatusBadge } from "../shared/status-badge";

interface Props {
  rows: OrderListRow[];
  locale: string;
  sort: { sort: OrderSort; dir: "asc" | "desc" };
  query: Record<string, string | undefined>;
  basePath?: string;
  /** Hide the customer column (customer detail page). */
  hideCustomer?: boolean;
}

export async function OrdersTable({ rows, locale, sort, query, basePath = "/admin/orders", hideCustomer }: Props) {
  const t = await getTranslations("admin");
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const columns: Column<OrderListRow>[] = [
    {
      key: "number",
      header: <SortHeader label={t("orders.number")} sortKey="number" current={sort} basePath={basePath} query={query} />,
      cell: (r) => (
        <Link href={`/admin/orders/${r.id}`} className="font-medium tabular-nums hover:underline" dir="ltr">
          {r.number}
        </Link>
      ),
    },
    {
      key: "placed",
      header: <SortHeader label={t("orders.placedAt")} sortKey="placed_at" current={sort} basePath={basePath} query={query} />,
      cell: (r) => <span className="text-muted-foreground tabular-nums">{date.format(new Date(r.placed_at))}</span>,
      hideBelow: "md",
    },
    ...(hideCustomer
      ? []
      : [
          {
            key: "customer",
            header: t("orders.customer"),
            cell: (r: OrderListRow) => (
              <div className="flex min-w-0 flex-col">
                <span className="truncate">{r.customer_name ?? "—"}</span>
                <span className="truncate text-xs text-muted-foreground" dir="ltr">
                  {r.email}
                </span>
              </div>
            ),
          } satisfies Column<OrderListRow>,
        ]),
    { key: "status", header: t("common.status"), cell: (r) => <StatusBadge kind="order" value={r.status} /> },
    { key: "payment", header: t("orders.payment"), cell: (r) => (r.payment_status ? <StatusBadge kind="payment" value={r.payment_status} /> : "—"), hideBelow: "lg" },
    {
      key: "total",
      header: <SortHeader label={t("orders.total")} sortKey="total" current={sort} basePath={basePath} query={query} className="justify-end" />,
      cell: (r) => <span className="font-medium tabular-nums">{formatMoney(r.total, r.currency, locale)}</span>,
      className: "text-end",
    },
  ];
  return <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} empty={<EmptyState title={t("common.noResults")} description={t("common.noResultsHint")} />} />;
}
