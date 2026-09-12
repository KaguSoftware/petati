import { Paperclip } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ExpenseCategoryRow, ExpenseListRow, ExpenseSort } from "@/lib/admin/finance/types";
import { formatMoney } from "@/lib/money";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";
import { SortHeader } from "../shared/sort-header";
import { ExpenseRowActions } from "./expense-row-actions";
import { dateTimeFormat } from "@/lib/number";

interface Props {
  rows: ExpenseListRow[];
  locale: string;
  currency: string;
  storeId: string;
  categories: ExpenseCategoryRow[];
  sort: { sort: ExpenseSort; dir: "asc" | "desc" };
  query: Record<string, string | undefined>;
  /** Show edit / delete controls (finance.write). */
  canWrite: boolean;
  basePath?: string;
}

export async function ExpensesTable({ rows, locale, currency, storeId, categories, sort, query, canWrite, basePath = "/admin/finance/expenses" }: Props) {
  const t = await getTranslations("admin.finance");
  const date = dateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });
  const shortDate = dateTimeFormat(locale, { day: "numeric", month: "short" });

  const columns: Column<ExpenseListRow>[] = [
    {
      key: "date",
      header: <SortHeader label={t("table.date")} sortKey="spent_on" current={sort} basePath={basePath} query={query} />,
      cell: (r) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          {/* Short date on phones so the row fits; full date from sm up. */}
          <span className="tabular-nums sm:hidden">{shortDate.format(new Date(`${r.spent_on}T00:00:00`))}</span>
          <span className="hidden tabular-nums sm:inline">{date.format(new Date(`${r.spent_on}T00:00:00`))}</span>
          {r.receipt_url && (
            <a href={r.receipt_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground" title={t("table.viewReceipt")} aria-label={t("table.viewReceipt")}>
              <Paperclip className="size-3.5" />
            </a>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: t("table.category"),
      cell: (r) => (r.category_name ? <span className="block max-w-40 truncate">{r.category_name}</span> : <span className="text-muted-foreground">—</span>),
      hideBelow: "sm",
    },
    {
      key: "vendor",
      header: t("table.vendor"),
      cell: (r) => (
        <div className="flex max-w-28 min-w-0 flex-col sm:max-w-60 xl:max-w-sm">
          <span className="truncate">{r.vendor ?? "—"}</span>
          {r.note && <span className="truncate text-xs text-muted-foreground">{r.note}</span>}
        </div>
      ),
    },
    {
      key: "amount",
      header: <SortHeader label={t("table.amount")} sortKey="amount" current={sort} basePath={basePath} query={query} className="justify-end" />,
      cell: (r) => <span className="font-medium whitespace-nowrap tabular-nums">{formatMoney(r.amount, r.currency || currency, locale)}</span>,
      className: "text-end",
    },
    ...(canWrite
      ? [
          {
            key: "actions",
            header: <span className="sr-only">{t("table.actions")}</span>,
            cell: (r: ExpenseListRow) => <ExpenseRowActions storeId={storeId} currency={currency} categories={categories} expense={r} />,
            className: "w-20 pe-2",
          } satisfies Column<ExpenseListRow>,
        ]
      : []),
  ];

  return <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} empty={<EmptyState title={t("table.empty")} description={t("table.emptyHint")} />} />;
}
