"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resequenceStopsAction } from "@/lib/admin/delivery/actions";
import { EntityLink } from "../shared/entity-link";
import { StatusBadge } from "../shared/status-badge";
import { useOptimisticAction } from "../shared/use-optimistic-action";

interface Stop {
  id: string;
  index: number;
  orderId: string;
  orderNumber: string;
  customer: string | null;
  phone: string | null;
  address: string | null;
  slot: string | null;
  cash: string | null;
  state: string;
}

interface Props {
  storeId: string;
  stops: Stop[];
  canReorder: boolean;
  labels: { moveUp: string; moveDown: string; codeBox: string; empty: string };
}

/**
 * The ordered stops of a run, reorderable with two buttons — no drag dependency, and it works on a
 * touch screen. One component owns the whole array, so the order is plain local state with a
 * snapshot to roll back to, rather than the cross-cell optimistic store.
 */
export function RunStops({ storeId, stops, canReorder, labels }: Props) {
  const [order, setOrder] = useState(stops);
  const { run, pending } = useOptimisticAction("admin.delivery");

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return;
    const snapshot = order;
    const next = [...order];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    setOrder(next);

    const fd = new FormData();
    fd.set("storeId", storeId);
    for (const s of next) fd.append("deliveryIds", s.id);
    run(() => resequenceStopsAction({}, fd), { rollback: () => setOrder(snapshot) });
  }

  if (order.length === 0) return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{labels.empty}</p>;

  return (
    <ol className="flex flex-col gap-2">
      {order.map((stop, i) => (
        <li key={stop.id} className="flex items-start gap-3 rounded-lg border p-3 print:break-inside-avoid">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium tabular-nums">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="print:hidden">
                <EntityLink kind="order" id={stop.orderId} label={stop.orderNumber} />
              </span>
              <span dir="ltr" className="hidden font-medium tabular-nums print:inline">
                {stop.orderNumber}
              </span>
              <span className="truncate">{stop.customer ?? "—"}</span>
              {stop.slot && <span className="text-xs text-muted-foreground">{stop.slot}</span>}
              {stop.state !== "assigned" && stop.state !== "out_for_delivery" && (
                <span className="print:hidden">
                  <StatusBadge kind="delivery" value={stop.state} />
                </span>
              )}
            </p>
            {stop.address && <p className="text-sm text-muted-foreground">{stop.address}</p>}
            {stop.phone && (
              <p className="text-sm text-muted-foreground" dir="ltr">
                {stop.phone}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {stop.cash && <span className="text-sm font-medium tabular-nums">{stop.cash}</span>}
            {/* The courier writes the customer's code here; it is never printed for them. */}
            <span className="hidden h-7 w-24 rounded border border-dashed print:block" aria-hidden />
            <span className="hidden text-[10px] text-muted-foreground print:block">{labels.codeBox}</span>
          </div>
          {canReorder && (
            <div className="flex shrink-0 flex-col print:hidden">
              <Button type="button" variant="ghost" size="icon-sm" aria-label={labels.moveUp} disabled={pending || i === 0} onClick={() => move(i, i - 1)}>
                <ChevronUp />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={labels.moveDown} disabled={pending || i === order.length - 1} onClick={() => move(i, i + 1)}>
                <ChevronDown />
              </Button>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
