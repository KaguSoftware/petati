import { getTranslations } from "next-intl/server";
import type { DeliveryLogRow } from "@/lib/admin/delivery/queries";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";
import { EntityLink } from "../shared/entity-link";
import { dateTimeFormat } from "@/lib/number";

const TONE: Record<string, string> = {
  delivered: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  failed: "bg-destructive/10 text-destructive",
  dispatched: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  settled: "bg-primary/10 text-primary",
  note: "bg-primary/10 text-primary",
};

/** What a row's `data` says in one short line, for the events where it matters. */
function detail(r: DeliveryLogRow, t: Awaited<ReturnType<typeof getTranslations<"admin.delivery">>>): string | null {
  const d = r.data ?? {};
  const parts: string[] = [];
  if (r.type === "failed" && typeof d.failure_reason === "string" && t.has(`failureReason.${d.failure_reason}`)) parts.push(t(`failureReason.${d.failure_reason}`));
  if (r.type === "delivered" && d.verified === false) parts.push(t("unverified"));
  if (r.type === "delivered" && typeof d.recipient_name === "string" && d.recipient_name) parts.push(d.recipient_name);
  if (r.type === "note" && d.checked === true) parts.push(t("rowActions.markChecked"));
  if (typeof d.note === "string" && d.note) parts.push(d.note);
  if (typeof d.no_code_reason === "string" && d.no_code_reason) parts.push(d.no_code_reason);
  return parts.length ? parts.join(" · ") : null;
}

/** The append-only feed. A row written by a courier has no staff actor — it says "Courier app". */
export async function DeliveryLogTable({ rows, locale, hideCourier }: { rows: DeliveryLogRow[]; locale: string; hideCourier?: boolean }) {
  const t = await getTranslations("admin.delivery");
  const date = dateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" });
  const columns: Column<DeliveryLogRow>[] = [
    { key: "when", header: t("log.when"), cell: (r) => <span className="text-muted-foreground tabular-nums">{date.format(new Date(r.created_at))}</span> },
    {
      key: "type",
      header: t("log.event"),
      cell: (r) => {
        const line = detail(r, t);
        return (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className={`w-fit rounded px-1.5 py-0.5 text-xs font-medium ${TONE[r.type] ?? "bg-muted text-muted-foreground"}`}>{t.has(`event.${r.type}`) ? t(`event.${r.type}`) : r.type}</span>
            {line && <span className="truncate text-xs text-muted-foreground">{line}</span>}
          </div>
        );
      },
    },
    {
      key: "order",
      header: t("log.order"),
      cell: (r) => (r.order_id ? <EntityLink kind="order" id={r.order_id} label={r.order_number ?? "—"} /> : <span className="text-muted-foreground">—</span>),
    },
    ...(hideCourier
      ? []
      : [
          {
            key: "courier",
            header: t("courier"),
            cell: (r: DeliveryLogRow) => (r.courier_id && r.courier_name ? <EntityLink kind="courier" id={r.courier_id} label={r.courier_name} muted /> : <span className="text-muted-foreground">—</span>),
            hideBelow: "md" as const,
          } satisfies Column<DeliveryLogRow>,
        ]),
    { key: "actor", header: t("log.by"), cell: (r) => <span className="truncate text-muted-foreground">{r.actor_name ?? t("log.system")}</span>, hideBelow: "lg" },
  ];
  return <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} empty={<EmptyState title={t("log.none")} />} />;
}
