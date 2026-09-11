import { getTranslations } from "next-intl/server";
import { AlertTriangle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { DeliverySlot } from "@/lib/delivery/settings";
import type { DeliveryListRow } from "@/lib/admin/delivery/types";
import { slotLabel } from "@/lib/delivery/settings";
import { formatMoney } from "@/lib/money";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";
import { StatusBadge } from "../shared/status-badge";
import { DeliveryBulkBar } from "./delivery-bulk-bar";
import { DeliveryRowCheckbox, DeliverySelectAll } from "./delivery-row-select";

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
}

export async function DispatchTable({ rows, bucket, storeId, locale, canAssign, couriers, today, tomorrow, slots, codEnabled }: Props) {
  const t = await getTranslations("admin");
  // The scope carries the bucket: every panel is mounted at once, so a shared scope would let a
  // selection made on one tab act on another tab's rows.
  const scope = `delivery:${bucket}`;
  const ids = rows.map((r) => r.id);
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });

  const columns: Column<DeliveryListRow>[] = [
    ...(canAssign
      ? [{ key: "select", className: "w-10", header: <DeliverySelectAll scope={scope} ids={ids} />, cell: (r: DeliveryListRow) => <DeliveryRowCheckbox scope={scope} id={r.id} /> } satisfies Column<DeliveryListRow>]
      : []),
    {
      key: "order",
      header: t("orders.number"),
      cell: (r) => (
        <div className="flex min-w-0 flex-col">
          <Link href={`/admin/orders/${r.order_id}`} className="font-medium tabular-nums hover:underline" dir="ltr">
            {r.order_number}
          </Link>
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
    {
      key: "courier",
      header: t("delivery.courier"),
      cell: (r) => <span className="truncate">{r.courier_name ?? <span className="text-muted-foreground">{t("delivery.noCourier")}</span>}</span>,
      hideBelow: "md",
    },
    {
      key: "scheduled",
      header: t("delivery.scheduledFor"),
      cell: (r) => (
        <span className="text-muted-foreground tabular-nums">
          {r.scheduled_for ? date.format(new Date(r.scheduled_for)) : "—"}
          {r.slot ? ` · ${slotLabel(slots.find((s) => s.key === r.slot) ?? { key: r.slot, label: {}, from: "", to: "" }, locale, locale)}` : ""}
        </span>
      ),
      hideBelow: "lg",
    },
    {
      key: "state",
      header: t("common.status"),
      cell: (r) => (
        <span className="flex items-center gap-1.5">
          <StatusBadge kind="delivery" value={r.state} />
          {r.state === "delivered" && !r.verified && <AlertTriangle className="size-3.5 text-amber-600" aria-label={t("delivery.unverified")} />}
        </span>
      ),
    },
    ...(codEnabled
      ? [
          {
            key: "cash",
            className: "text-end",
            header: t("delivery.cash"),
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
  ];

  return (
    <>
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} empty={<EmptyState title={t("delivery.empty.day")} />} />
      {canAssign && rows.length > 0 && (
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
