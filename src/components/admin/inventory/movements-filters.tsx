"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_STOCK_REASONS } from "@/lib/admin/inventory/types";
import type { StockReason } from "@/lib/db/types";
import { useListNavigation } from "../shared/table-toolbar";

const ALL = "__all";

interface Props {
  reason?: StockReason;
  /** Label of the variant the list is filtered to, when `?variant=` is set. */
  variantFilter?: { productName: string; variantLabel: string; sku: string | null } | null;
}

export function MovementsFilters({ reason, variantFilter }: Props) {
  const t = useTranslations("admin");
  const { setParam } = useListNavigation();
  const items = [{ value: ALL, label: t("inventory.allReasons") }, ...ALL_STOCK_REASONS.map((r) => ({ value: r, label: t(`stockReason.${r}`) }))];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select items={items} modal={false} value={reason ?? ALL} onValueChange={(v) => setParam("reason", v === ALL || v == null ? null : String(v))}>
        <SelectTrigger aria-label={t("inventory.reason")} className="w-full sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {variantFilter && (
        <span className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-lg border bg-muted/40 ps-3 pe-1 text-sm">
          <span className="truncate">
            {t("inventory.filteredBy")}: <span className="font-medium">{variantFilter.productName}</span>
            {variantFilter.variantLabel && ` · ${variantFilter.variantLabel}`}
            {variantFilter.sku && (
              <span className="mx-1 text-xs text-muted-foreground" dir="ltr">
                {variantFilter.sku}
              </span>
            )}
          </span>
          <Button type="button" variant="ghost" size="icon-xs" aria-label={t("inventory.clearFilter")} onClick={() => setParam("variant", null)}>
            <X />
          </Button>
        </span>
      )}
    </div>
  );
}
