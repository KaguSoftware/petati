"use client";

import { useState } from "react";
import { Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignDeliveriesAction } from "@/lib/admin/delivery/actions";
import { DELIVERABLE_STATUSES } from "@/lib/admin/delivery/types";
import { bulkUpdateOrderStatusAction } from "@/lib/admin/orders/actions";
import { canTransition } from "@/lib/admin/orders/transitions";
import type { OrderStatus } from "@/lib/db/types";
import { ConfirmDialog } from "../shared/confirm-dialog";
import { clearOptimistic, setOptimistic } from "../shared/optimistic-store";
import { clearSelection, useSelection } from "../shared/selection-store";
import { useOptimisticAction } from "../shared/use-optimistic-action";

interface Props {
  storeId: string;
  /** Selection scope — the status bucket this table belongs to. */
  scope: string;
  /** Status of every row on the page, so the bar knows which moves are legal. */
  statuses: Record<string, OrderStatus>;
  /** Rows that already have an open stop cannot be assigned again from here. */
  hasOpenDelivery?: Record<string, boolean>;
  /** Active couriers; omitted when the user cannot assign. */
  couriers?: { id: string; name: string }[];
  today?: string;
  tomorrow?: string;
}

const MOVES = [
  { status: "shipped", labelKey: "actions.ship" },
  { status: "delivered", labelKey: "actions.markDelivered" },
] as const;

/**
 * Sits under the table and appears only once something is ticked. Every button acts on the rows
 * that can legally make that move; the rest stay selected and are reported as skipped. "Assign
 * courier" is the same action the delivery board uses, so dispatch can start from the orders list.
 */
export function OrdersBulkBar({ storeId, scope, statuses, hasOpenDelivery = {}, couriers, today, tomorrow }: Props) {
  const t = useTranslations("admin.orders");
  const td = useTranslations("admin.delivery");
  const selected = useSelection(scope);
  const { run, pending } = useOptimisticAction("admin.orders");
  const [courierId, setCourierId] = useState(couriers?.[0]?.id ?? "");
  const [day, setDay] = useState(tomorrow ?? today ?? "");
  const ids = [...selected].filter((id) => statuses[id]);
  if (ids.length === 0) return null;

  const eligibleFor = (to: OrderStatus) => ids.filter((id) => canTransition(statuses[id], to));
  const assignable = ids.filter((id) => (DELIVERABLE_STATUSES as readonly string[]).includes(statuses[id]) && !hasOpenDelivery[id]);
  const canAssign = Boolean(couriers && couriers.length > 0 && today && tomorrow);

  function apply(to: OrderStatus) {
    const eligible = eligibleFor(to);
    if (eligible.length === 0) return;
    const fd = new FormData();
    fd.set("storeId", storeId);
    fd.set("status", to);
    for (const id of eligible) fd.append("orderIds", id);
    run(() => bulkUpdateOrderStatusAction({}, fd), {
      optimistic: () => eligible.forEach((id) => setOptimistic(id, { status: to })),
      rollback: () => eligible.forEach((id) => clearOptimistic(id, ["status"])),
      onSuccess: (state) => {
        clearSelection(scope);
        toast.success(t("bulk.done", { changed: state.changed ?? eligible.length, skipped: (state.skipped ?? 0) + (ids.length - eligible.length) }));
      },
    });
  }

  function assign() {
    if (!courierId || assignable.length === 0) return;
    const fd = new FormData();
    fd.set("storeId", storeId);
    fd.set("courierId", courierId);
    fd.set("scheduledFor", day);
    for (const id of assignable) fd.append("orderIds", id);
    run(() => assignDeliveriesAction({}, fd), {
      onSuccess: (state) => {
        clearSelection(scope);
        toast.success(t("bulk.done", { changed: state.changed ?? assignable.length, skipped: (state.skipped ?? 0) + (ids.length - assignable.length) }));
      },
    });
  }

  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2 shadow-lg ring-1 ring-foreground/10 dark:ring-foreground/15">
      <span className="ps-2 text-sm font-medium">{t("bulk.selected", { count: ids.length })}</span>
      <Button type="button" variant="ghost" size="sm" onClick={() => clearSelection(scope)}>
        {t("bulk.clear")}
      </Button>
      <span className="flex-1" />
      {canAssign && (
        <>
          <Select value={courierId} onValueChange={(v) => setCourierId(v ?? "")}>
            <SelectTrigger size="sm" className="w-40" aria-label={td("bulk.pickCourier")}>
              <SelectValue>{couriers!.find((c) => c.id === courierId)?.name ?? td("bulk.pickCourier")}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {couriers!.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={day} onValueChange={(v) => setDay(v ?? today!)}>
            <SelectTrigger size="sm" className="w-32">
              <SelectValue>{day === today ? td("date.today") : td("date.tomorrow")}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={today!}>{td("date.today")}</SelectItem>
              <SelectItem value={tomorrow!}>{td("date.tomorrow")}</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" size="sm" disabled={pending || !courierId || assignable.length === 0} onClick={assign}>
            <Truck data-icon="inline-start" />
            {t("bulk.assign")}
          </Button>
        </>
      )}
      {MOVES.map((m) => (
        <Button key={m.status} type="button" variant="outline" size="sm" disabled={pending || eligibleFor(m.status).length === 0} onClick={() => apply(m.status)}>
          {t(m.labelKey)}
        </Button>
      ))}
      <ConfirmDialog
        trigger={
          <Button type="button" variant="destructive" size="sm" disabled={pending || eligibleFor("cancelled").length === 0}>
            {t("actions.cancel")}
          </Button>
        }
        title={t("bulk.confirmCancelTitle", { count: eligibleFor("cancelled").length })}
        description={t("cancel.description")}
        confirmLabel={t("actions.cancel")}
        destructive
        action={async () => {
          apply("cancelled");
        }}
      />
    </div>
  );
}
