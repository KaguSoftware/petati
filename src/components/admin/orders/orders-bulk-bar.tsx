"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
}

const MOVES = [
  { status: "shipped", labelKey: "actions.ship" },
  { status: "delivered", labelKey: "actions.markDelivered" },
] as const;

/**
 * Sits under the table and appears only once something is ticked. Every button acts on the rows
 * that can legally make that move; the rest stay selected and are reported as skipped.
 */
export function OrdersBulkBar({ storeId, scope, statuses }: Props) {
  const t = useTranslations("admin.orders");
  const selected = useSelection(scope);
  const { run, pending } = useOptimisticAction("admin.orders");
  const ids = [...selected].filter((id) => statuses[id]);
  if (ids.length === 0) return null;

  const eligibleFor = (to: OrderStatus) => ids.filter((id) => canTransition(statuses[id], to));

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

  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2 shadow-lg">
      <span className="ps-2 text-sm font-medium">{t("bulk.selected", { count: ids.length })}</span>
      <Button type="button" variant="ghost" size="sm" onClick={() => clearSelection(scope)}>
        {t("bulk.clear")}
      </Button>
      <span className="flex-1" />
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
