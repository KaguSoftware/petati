"use client";

import { useTranslations } from "next-intl";
import { startTransition, useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { setTrackingAction } from "@/lib/admin/inventory/actions";
import { TableToolbar, useListNavigation } from "../shared/table-toolbar";
import { useActionToast } from "../shared/use-action-toast";

/** Search + "low stock only" toggle for the stock table. */
export function StockFilters({ lowOnly, actions }: { lowOnly: boolean; actions?: React.ReactNode }) {
  const t = useTranslations("admin.inventory");
  const { setParam } = useListNavigation();
  return (
    <TableToolbar searchPlaceholder={t("searchPlaceholder")} actions={actions}>
      <Label className="flex h-8 items-center gap-2 rounded-lg border px-3 text-sm font-normal">
        <Switch size="sm" checked={lowOnly} onCheckedChange={(v) => setParam("low", v ? "1" : null)} />
        {t("lowOnly")}
      </Label>
    </TableToolbar>
  );
}

/** Inline switch for track_inventory / allow_backorder (products.write). */
export function TrackingSwitch({ storeId, variantId, field, checked, disabled }: { storeId: string; variantId: string; field: "track_inventory" | "allow_backorder"; checked: boolean; disabled?: boolean }) {
  const t = useTranslations("admin.inventory");
  const [value, setValue] = useState(checked);
  const [, action, pending] = useActionToast(setTrackingAction, { errorNamespace: "admin.inventory" });
  return (
    <Switch
      size="sm"
      checked={value}
      disabled={disabled || pending}
      aria-label={t(field === "track_inventory" ? "tracking" : "backorder")}
      onCheckedChange={(next) => {
        setValue(next);
        const fd = new FormData();
        fd.set("storeId", storeId);
        fd.set("variantId", variantId);
        fd.set("field", field);
        if (next) fd.set("value", "on");
        startTransition(() => action(fd));
      }}
    />
  );
}
