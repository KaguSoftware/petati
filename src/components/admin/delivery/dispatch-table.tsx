import { getTranslations } from "next-intl/server";
import { AlertTriangle } from "lucide-react";
import type { DeliverySlot } from "@/lib/delivery/settings";
import type { DeliveryListRow } from "@/lib/admin/delivery/types";
import { slotLabel } from "@/lib/delivery/settings";
import { formatMoney } from "@/lib/money";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";
import { EntityLink } from "../shared/entity-link";
import { OptimisticStatusBadge } from "../shared/optimistic-status-badge";
import { DeliveryBulkBar } from "./delivery-bulk-bar";
import { DeliveryRowActions } from "./delivery-row-actions";
import { DeliveryRowCheckbox, DeliverySelectAll } from "./delivery-row-select";
import { dateTimeFormat } from "@/lib/number";

interface Props {
  rows: DeliveryListRow[];
  bucket: string;
  storeId: string;
  locale: string;
  canAssign: boolean;
  couriers: { id: string; name: string }[];
  today: string;
  tomorrow: string;
  slots: DeliverySlot[];
  codEnabled: boolean;
  /** Hide the courier column (courier page: every row is theirs). */
  hideCourier?: boolean;
  /** Hide the bulk bar (history views). */
  noBulk?: boolean;
}

export async function DispatchTable({ rows, bucket, storeId, locale, canAssign, couriers, today, tomorrow, slots, codEnabled, hideCourier, noBulk }: Props) {
  const t = await getTranslations("admin");
  // The scope carries the bucket: every panel is mounted at once, so a shared scope would let a
  // selection made on one tab act on another tab's rows.
  const scope = `delivery:${bucket}`;
  const ids = rows.map((r) => r.id);
  const date = dateTimeFormat(locale, { day: "numeric", month: "short" });
  const selectable = canAssign && !noBulk;

  const columns: Column<DeliveryListRow>[] = [
    ...(selectable
      ? [{ key: "select", className: "w-10", header: <DeliverySelectAll scope={scope} ids={ids} />, cell: (r: DeliveryListRow) => <DeliveryRowCheckbox scope={scope} id={r.id} /> } satisfies Column<DeliveryListRow>]
      : []),
    {
      key: "order",
      header: t("orders.number"),
      cell: (r) => (
        <div className="flex min-w-0 flex-col">
          <EntityLink kind="order" id={r.order_id} label={r.order_number} />
          {r.attempt_no > 1 && <span className="text-xs text-muted-foreground">{t("delivery.attempt")} {r.attempt_no}</span>}
        </div>
      ),
    },
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
    ...(hideCourier
      ? []
      : [
          {
            key: "courier",
            header: t("delivery.courier"),
            cell: (r: DeliveryListRow) =>
              r.courier_id && r.courier_name ? (
                <EntityLink kind="courier" id={r.courier_id} label={r.courier_name} muted />
              ) : (
                <span className="text-muted-foreground">{t("delivery.noCourier")}</span>
              ),
            hideBelow: "md" as const,
          } satisfies Column<DeliveryListRow>,
        ]),
    {
      key: "scheduled",
      header: t("delivery.scheduledFor"),
      cell: (r) =>
        r.scheduled_for && r.courier_id ? (
          <EntityLink kind="run" id={r.courier_id} query={`d=${r.scheduled_for}`} muted className="tabular-nums" label={`${date.format(new Date(r.scheduled_for))}${r.slot ? ` · ${slotLabel(slots.find((s) => s.key === r.slot) ?? { key: r.slot, label: {}, from: "", to: "" }, locale, locale)}` : ""}`} />
        ) : (
          <span className="text-muted-foreground tabular-nums">{r.scheduled_for ? date.format(new Date(r.scheduled_for)) : "—"}</span>
        ),
      hideBelow: "lg",
    },
    {
      key: "state",
      header: t("common.status"),
      cell: (r) => (
        <span className="flex items-center gap-1.5">
          <OptimisticStatusBadge id={r.id} kind="delivery" value={r.state} field="state" />
          {r.state === "delivered" && !r.verified && <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400" aria-label={t("delivery.unverified")} />}
        </span>
      ),
    },
    ...(codEnabled
      ? [
          {
            key: "cash",
            className: "text-end",
            header: t("delivery.cashLabel"),
            cell: (r: DeliveryListRow) =>
              r.cash_expected > 0 ? (
                <span className="tabular-nums">{formatMoney(r.cash_collected ?? r.cash_expected, r.currency, locale)}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
            hideBelow: "lg" as const,
          } satisfies Column<DeliveryListRow>,
        ]
      : []),
    ...(canAssign
      ? [
          {
            key: "actions",
            className: "w-px",
            header: <span className="sr-only">{t("common.actions")}</span>,
            cell: (r: DeliveryListRow) => (
              <DeliveryRowActions
                storeId={storeId}
                delivery={{ id: r.id, orderId: r.order_id, state: r.state, verified: r.verified, courierId: r.courier_id, scheduledFor: r.scheduled_for, cashExpected: r.cash_expected, currency: r.currency }}
              />
            ),
          } satisfies Column<DeliveryListRow>,
        ]
      : []),
  ];

  return (
    <>
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} empty={<EmptyState title={t("delivery.empty.day")} />} />
      {selectable && rows.length > 0 && (
        <DeliveryBulkBar
          storeId={storeId}
          scope={scope}
          kind="delivery"
          states={Object.fromEntries(rows.map((r) => [r.id, r.state]))}
          couriers={couriers}
          today={today}
          tomorrow={tomorrow}
          slots={slots.map((s) => ({ key: s.key, label: slotLabel(s, locale, locale) }))}
        />
      )}
    </>
  );
}
