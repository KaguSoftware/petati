"use client";

import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CategoryOption } from "@/lib/admin/products/types";
import { PRODUCT_STATUSES } from "@/lib/admin/products/types";
import type { ProductStatus } from "@/lib/db/types";
import { StatusTabs } from "../shared/status-tabs";
import { TableToolbar, useListNavigation } from "../shared/table-toolbar";

interface Props {
  counts: Partial<Record<ProductStatus | "all", number>>;
  status?: ProductStatus;
  categoryId?: string;
  categories: CategoryOption[];
  actions?: React.ReactNode;
}

const ALL = "__all";

export function ProductsFilters({ counts, status, categoryId, categories, actions }: Props) {
  const t = useTranslations("admin");
  const { setParam } = useListNavigation();
  const items = [{ value: ALL, label: t("products.allCategories") }, ...categories.map((c) => ({ value: c.id, label: c.name }))];
  return (
    <div className="flex flex-col gap-3">
      <StatusTabs
        label={t("common.status")}
        value={status ?? "all"}
        items={[
          { value: "all", label: t("common.all"), count: counts.all ?? 0 },
          ...PRODUCT_STATUSES.map((s) => ({ value: s, label: t(`status.product.${s}`), count: counts[s] ?? 0 })),
        ]}
        onValueChange={(v) => setParam("status", v === "all" ? null : v)}
      />
      <TableToolbar searchPlaceholder={t("products.searchPlaceholder")} actions={actions}>
        <Select items={items} modal={false} value={categoryId ?? ALL} onValueChange={(v) => setParam("category", v === ALL || v == null ? null : String(v))}>
          <SelectTrigger aria-label={t("products.filterCategory")} className="w-full sm:w-52">
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
      </TableToolbar>
    </div>
  );
}
