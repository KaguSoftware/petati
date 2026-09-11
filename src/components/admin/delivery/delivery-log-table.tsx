import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { DeliveryLogRow } from "@/lib/admin/delivery/queries";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";

const TONE: Record<string, string> = {
  delivered: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  failed: "bg-destructive/10 text-destructive",
  dispatched: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  settled: "bg-primary/10 text-primary",
};

/** The append-only feed. A row written by a courier has no staff actor — it says "Courier app". */
export async function DeliveryLogTable({ rows, locale }: { rows: DeliveryLogRow[]; locale: string }) {
  const t = await getTranslations("admin.delivery");
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" });
  const columns: Column<DeliveryLogRow>[] = [
    { key: "when", header: t("log.event"), cell: (r) => <span className="text-muted-foreground tabular-nums">{date.format(new Date(r.created_at))}</span> },
    {
      key: "type",
      header: t("log.event"),
      cell: (r) => (
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${TONE[r.type] ?? "bg-muted text-muted-foreground"}`}>
          {t.has(`event.${r.type}`) ? t(`event.${r.type}`) : r.type}
        </span>
      ),
    },
    {
      key: "order",
      header: t("recipient"),
      cell: (r) =>
        r.order_id ? (
          <Link href={`/admin/orders/${r.order_id}`} className="tabular-nums hover:underline" dir="ltr">
            {r.order_number ?? "—"}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    { key: "courier", header: t("courier"), cell: (r) => <span className="truncate">{r.courier_name ?? "—"}</span>, hideBelow: "md" },
    { key: "actor", header: t("log.event"), cell: (r) => <span className="truncate text-muted-foreground">{r.actor_name ?? t("log.system")}</span>, hideBelow: "lg" },
  ];
  return <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} empty={<EmptyState title={t("log.none")} />} />;
}
