import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { OrderListRow, OrderSort } from "@/lib/admin/orders/queries";
import { formatMoney } from "@/lib/money";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";
import { SortHeader } from "../shared/sort-header";
import { StatusBadge } from "../shared/status-badge";
import { OrdersBulkBar } from "./orders-bulk-bar";
import { RowCheckbox, SelectAllCheckbox } from "./row-select";

interface Props {
  rows: OrderListRow[];
  locale: string;
  sort: { sort: OrderSort; dir: "asc" | "desc" };
  query: Record<string, string | undefined>;
  basePath?: string;
  /** Hide the customer column (customer detail page). */
  hideCustomer?: boolean;
  /** Store id for the bulk bar; omit to render the table without selection. */
  storeId?: string;
  /** Selection scope (the status bucket). Required together with `storeId` to enable selection. */
  scope?: string;
}

export async function OrdersTable({ rows, locale, sort, query, basePath = "/admin/orders", hideCustomer, storeId, scope }: Props) {
  const t = await getTranslations("admin");
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const selectable = Boolean(storeId && scope);
  const ids = rows.map((r) => r.id);
  const columns: Column<OrderListRow>[] = [
    ...(selectable
      ? [
          {
            key: "select",
            className: "w-10",
            header: <SelectAllCheckbox scope={scope!} ids={ids} />,
            cell: (r: OrderListRow) => <RowCheckbox scope={scope!} id={r.id} />,
          } satisfies Column<OrderListRow>,
        ]
      : []),
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
  return (
    <>
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} empty={<EmptyState title={t("common.noResults")} description={t("common.noResultsHint")} />} />
      {selectable && rows.length > 0 && (
        <OrdersBulkBar storeId={storeId!} scope={scope!} statuses={Object.fromEntries(rows.map((r) => [r.id, r.status]))} />
      )}
    </>
  );
}
