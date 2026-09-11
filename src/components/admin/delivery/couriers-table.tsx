import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { CourierWithLoad } from "@/lib/admin/delivery/types";
import { formatMoney } from "@/lib/money";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";
import { EntityLink } from "../shared/entity-link";
import { CourierRowActions } from "./courier-row-actions";

interface Props {
  storeId: string;
  rows: CourierWithLoad[];
  locale: string;
  currency: string;
  emptyTitle: string;
  emptyHint: string;
}

export async function CouriersTable({ storeId, rows, locale, currency, emptyTitle, emptyHint }: Props) {
  const t = await getTranslations("admin");
  const columns: Column<CourierWithLoad>[] = [
    {
      key: "name",
      header: t("delivery.couriers.name"),
      cell: (r) => (
        <div className="flex min-w-0 flex-col">
          <EntityLink kind="courier" id={r.id} label={r.name} className={r.is_active ? "" : "text-muted-foreground line-through"} />
          {r.vehicle && <span className="truncate text-xs text-muted-foreground">{t(`delivery.vehicle.${r.vehicle}`)}</span>}
        </div>
      ),
    },
    {
      key: "phone",
      header: t("delivery.couriers.phone"),
      cell: (r) =>
        r.phone ? (
          <a href={`tel:${r.phone}`} className="hover:underline" dir="ltr">
            {r.phone}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      hideBelow: "md",
    },
    {
      key: "stops",
      header: t("delivery.couriers.openStops"),
      cell: (r) => (r.open_stops > 0 ? <EntityLink kind="run" id={r.id} label={String(r.open_stops)} muted className="tabular-nums" /> : <span className="text-muted-foreground tabular-nums">0</span>),
      hideBelow: "sm",
    },
    {
      key: "cash",
      className: "text-end",
      header: t("delivery.couriers.cashHeld"),
      cell: (r) => (r.cash_held > 0 ? <Link href={`/admin/delivery/cash#${r.id}`} className="tabular-nums underline-offset-4 hover:underline">{formatMoney(r.cash_held, currency, locale)}</Link> : <span className="text-muted-foreground">—</span>),
      hideBelow: "lg",
    },
    {
      key: "actions",
      className: "w-px",
      header: <span className="sr-only">{t("common.actions")}</span>,
      cell: (r) => (
        <CourierRowActions
          storeId={storeId}
          locale={locale}
          hasStops={r.open_stops > 0}
          courier={{ id: r.id, name: r.name, phone: r.phone, vehicle: r.vehicle, note: r.note, is_active: r.is_active }}
        />
      ),
    },
  ];
  return <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} empty={<EmptyState title={emptyTitle} description={emptyHint} />} />;
}
