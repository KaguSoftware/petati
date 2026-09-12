"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignDeliveriesAction, dispatchDeliveriesAction, unassignDeliveriesAction } from "@/lib/admin/delivery/actions";
import type { DeliveryState } from "@/lib/db/types";
import { DELIVERY_TRANSITIONS } from "@/lib/admin/delivery/types";
import { clearOptimistic, setOptimistic } from "../shared/optimistic-store";
import { clearSelection, useSelection } from "../shared/selection-store";
import { useOptimisticAction } from "../shared/use-optimistic-action";

interface Props {
  storeId: string;
  scope: string;
  /** "queue" rows are orders without a delivery yet; "delivery" rows are existing stops. */
  kind: "queue" | "delivery";
  /** Current state per row id — absent for queue rows, which have no delivery yet. */
  states?: Record<string, DeliveryState>;
  couriers: { id: string; name: string }[];
  today: string;
  tomorrow: string;
  slots: { key: string; label: string }[];
}

/**
 * The dispatcher's hands. Tick rows, pick a courier, pick a day, Assign — three clicks from "orders
 * that need delivering" to "on Ali's phone for tomorrow". The courier and day stay chosen between
 * runs, because a dispatcher assigns to the same person all morning.
 *
 * Only one Select is mounted per panel (here), never one per row: fifty row-level popovers would
 * make the board crawl.
 */
export function DeliveryBulkBar({ storeId, scope, kind, states, couriers, today, tomorrow, slots }: Props) {
  const t = useTranslations("admin.delivery");
  const selected = useSelection(scope);
  const { run, pending } = useOptimisticAction("admin.delivery");
  const [courierId, setCourierId] = useState(couriers[0]?.id ?? "");
  const [day, setDay] = useState(tomorrow);
  const [slot, setSlot] = useState(slots[0]?.key ?? "");
  const ids = [...selected];
  if (ids.length === 0) return null;

  const eligible = (to: DeliveryState) => (states ? ids.filter((id) => states[id] && DELIVERY_TRANSITIONS[states[id]].includes(to)) : ids);

  function finish(label: string, targets: string[], patch?: Record<string, unknown>) {
    return (state: { changed?: number; skipped?: number }) => {
      // Clear on success as well as on failure: a row that moves bucket unmounts without ever
      // seeing the server value, and a patch left behind would reappear with it.
      if (patch) targets.forEach((id) => clearOptimistic(id, Object.keys(patch)));
      clearSelection(scope);
      toast.success(t(label, { changed: state.changed ?? targets.length, skipped: state.skipped ?? 0 }));
    };
  }

  function assign() {
    if (!courierId) return;
    const fd = new FormData();
    fd.set("storeId", storeId);
    fd.set("courierId", courierId);
    fd.set("scheduledFor", day);
    if (slot) fd.set("slot", slot);
    const field = kind === "queue" ? "orderIds" : "deliveryIds";
    for (const id of ids) fd.append(field, id);
    const patch = { state: "assigned", courier_name: couriers.find((c) => c.id === courierId)?.name };
    run(() => assignDeliveriesAction({}, fd), {
      optimistic: () => kind === "delivery" && ids.forEach((id) => setOptimistic(id, patch)),
      rollback: () => ids.forEach((id) => clearOptimistic(id, Object.keys(patch))),
      onSuccess: finish("bulk.done", ids, patch),
    });
  }

  function move(action: typeof dispatchDeliveriesAction, to: DeliveryState, labelKey: string) {
    const targets = eligible(to);
    if (targets.length === 0) return;
    const fd = new FormData();
    fd.set("storeId", storeId);
    for (const id of targets) fd.append("deliveryIds", id);
    run(() => action({}, fd), {
      optimistic: () => targets.forEach((id) => setOptimistic(id, { state: to })),
      rollback: () => targets.forEach((id) => clearOptimistic(id, ["state"])),
      onSuccess: finish(labelKey, targets, { state: to }),
    });
  }

  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2 shadow-lg ring-1 ring-foreground/10 dark:ring-foreground/15">
      <span className="ps-2 text-sm font-medium">{t("bulk.selected", { count: ids.length })}</span>
      <Button type="button" variant="ghost" size="sm" onClick={() => clearSelection(scope)}>
        {t("bulk.clear")}
      </Button>
      <span className="flex-1" />

      <Select value={courierId} onValueChange={(v) => setCourierId(v ?? "")}>
        <SelectTrigger size="sm" className="w-40">
          <SelectValue>{couriers.find((c) => c.id === courierId)?.name ?? t("bulk.pickCourier")}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {couriers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={day} onValueChange={(v) => setDay(v ?? today)}>
        <SelectTrigger size="sm" className="w-32">
          <SelectValue>{day === today ? t("date.today") : t("date.tomorrow")}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={today}>{t("date.today")}</SelectItem>
          <SelectItem value={tomorrow}>{t("date.tomorrow")}</SelectItem>
        </SelectContent>
      </Select>

      {slots.length > 0 && (
        <Select value={slot} onValueChange={(v) => setSlot(v ?? "")}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue>{slots.find((s) => s.key === slot)?.label ?? ""}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {slots.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button type="button" size="sm" disabled={pending || !courierId} onClick={assign}>
        {t("assign")}
      </Button>
      {kind === "delivery" && (
        <>
          <Button type="button" size="sm" variant="outline" disabled={pending || eligible("out_for_delivery").length === 0} onClick={() => move(dispatchDeliveriesAction, "out_for_delivery", "bulk.done")}>
            {t("dispatch")}
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={pending || eligible("pending").length === 0} onClick={() => move(unassignDeliveriesAction, "pending", "bulk.done")}>
            {t("unassign")}
          </Button>
        </>
      )}
    </div>
  );
}
