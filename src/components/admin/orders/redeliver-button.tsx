"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { redeliverAction } from "@/lib/admin/delivery/actions";
import { useOptimisticAction } from "../shared/use-optimistic-action";

/** Opens a fresh attempt for a parcel that came back. The failed attempt is kept. */
export function RedeliverButton({ storeId, deliveryId, label }: { storeId: string; deliveryId: string; label: string }) {
  const { run, pending } = useOptimisticAction("admin.delivery");
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        const fd = new FormData();
        fd.set("storeId", storeId);
        fd.set("deliveryId", deliveryId);
        run(() => redeliverAction({}, fd));
      }}
    >
      <RotateCcw data-icon="inline-start" />
      {label}
    </Button>
  );
}
