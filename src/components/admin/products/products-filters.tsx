"use client";

import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BrandOption } from "@/lib/admin/brands/types";
import type { CategoryOption } from "@/lib/admin/products/types";
import { PRODUCT_STATUSES } from "@/lib/admin/products/types";
import type { ProductStatus } from "@/lib/db/types";
import { StatusTabs } from "../shared/status-tabs";
import { TableToolbar, useListNavigation } from "../shared/table-toolbar";

interface ToolbarProps {
  categoryId?: string;
  categories: CategoryOption[];
  brandId?: string;
  brands: BrandOption[];
  actions?: React.ReactNode;
}

interface Props extends ToolbarProps {
  counts: Partial<Record<ProductStatus | "all", number>>;
  status?: ProductStatus;
}

const ALL = "__all";

/** Search + category + brand filters (shared by the preloaded-tabs and the server-filtered list). */
export function ProductsToolbar({ categoryId, categories, brandId, brands, actions }: ToolbarProps) {
  const t = useTranslations("admin");
  const { setParam } = useListNavigation();
  const categoryItems = [{ value: ALL, label: t("products.allCategories") }, ...categories.map((c) => ({ value: c.id, label: c.name }))];
  const brandItems = [{ value: ALL, label: t("products.allBrands") }, ...brands.map((b) => ({ value: b.id, label: b.name }))];
  return (
    <TableToolbar searchPlaceholder={t("products.searchPlaceholder")} actions={actions}>
      <Select items={categoryItems} modal={false} value={categoryId ?? ALL} onValueChange={(v) => setParam("category", v === ALL || v == null ? null : String(v))}>
        <SelectTrigger aria-label={t("products.filterCategory")} className="w-full sm:w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {categoryItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select items={brandItems} modal={false} value={brandId ?? ALL} onValueChange={(v) => setParam("brand", v === ALL || v == null ? null : String(v))}>
        <SelectTrigger aria-label={t("products.filterBrand")} className="w-full sm:w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {brandItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </TableToolbar>
  );
}

/** Server-filtered mode (search/category/page active): status tabs navigate. */
export function ProductsFilters({ counts, status, categoryId, categories, brandId, brands, actions }: Props) {
  const t = useTranslations("admin");
  const { setParam } = useListNavigation();
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
      <ProductsToolbar categoryId={categoryId} categories={categories} brandId={brandId} brands={brands} actions={actions} />
    </div>
  );
}
