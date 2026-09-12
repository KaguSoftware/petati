import { getTranslations } from "next-intl/server";
import type { DeliverySlot } from "@/lib/delivery/settings";
import { slotLabel } from "@/lib/delivery/settings";
import type { UndeliveredOrderRow } from "@/lib/admin/delivery/types";
import { formatMoney } from "@/lib/money";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";
import { EntityLink } from "../shared/entity-link";
import { StatusBadge } from "../shared/status-badge";
import { DeliveryBulkBar } from "./delivery-bulk-bar";
import { DeliveryRowCheckbox, DeliverySelectAll } from "./delivery-row-select";
import { dateTimeFormat } from "@/lib/number";

interface Props {
  rows: UndeliveredOrderRow[];
  storeId: string;
  locale: string;
  canAssign: boolean;
  couriers: { id: string; name: string }[];
  today: string;
  tomorrow: string;
  slots: DeliverySlot[];
  codEnabled: boolean;
}

/**
 * Orders that need delivering and have no stop yet. Rows are keyed by ORDER id: assigning creates
 * the delivery row, which is what lets the module work on a store full of existing orders with no
 * backfill at all.
 */
export async function QueueTable({ rows, storeId, locale, canAssign, couriers, today, tomorrow, slots, codEnabled }: Props) {
  const t = await getTranslations("admin");
  const scope = "delivery:needs";
  const ids = rows.map((r) => r.id);
  const date = dateTimeFormat(locale, { day: "numeric", month: "short" });

  const columns: Column<UndeliveredOrderRow>[] = [
    ...(canAssign
      ? [{ key: "select", className: "w-10", header: <DeliverySelectAll scope={scope} ids={ids} />, cell: (r: UndeliveredOrderRow) => <DeliveryRowCheckbox scope={scope} id={r.id} /> } satisfies Column<UndeliveredOrderRow>]
      : []),
    { key: "order", header: t("orders.number"), cell: (r) => <EntityLink kind="order" id={r.id} label={r.number} /> },
    {
      key: "recipient",
      header: t("delivery.recipient"),
      cell: (r) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate">{r.customer_name ?? "—"}</span>
          {r.city && <span className="truncate text-xs text-muted-foreground">{r.city}</span>}
        </div>
      ),
    },
    { key: "placed", header: t("orders.placedAt"), cell: (r) => <span className="text-muted-foreground tabular-nums">{date.format(new Date(r.placed_at))}</span>, hideBelow: "md" },
    { key: "status", header: t("common.status"), cell: (r) => <StatusBadge kind="order" value={r.status} /> },
    ...(codEnabled
      ? [
          {
            key: "cash",
            className: "text-end",
            header: t("delivery.cashLabel"),
            cell: (r: UndeliveredOrderRow) => (r.cash_expected > 0 ? <span className="tabular-nums">{formatMoney(r.cash_expected, r.currency, locale)}</span> : <span className="text-muted-foreground">—</span>),
            hideBelow: "lg" as const,
          } satisfies Column<UndeliveredOrderRow>,
        ]
      : []),
  ];

  return (
    <>
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} empty={<EmptyState title={t("delivery.empty.needs")} description={t("delivery.empty.needsHint")} />} />
      {canAssign && rows.length > 0 && (
        <DeliveryBulkBar
          storeId={storeId}
          scope={scope}
          kind="queue"
          couriers={couriers}
          today={today}
          tomorrow={tomorrow}
          slots={slots.map((s) => ({ key: s.key, label: slotLabel(s, locale, locale) }))}
        />
      )}
    </>
  );
}
