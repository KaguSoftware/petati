"use client";

import { useId } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { ProductSort } from "@/lib/catalog/types";

const SORTS: ProductSort[] = ["newest", "price_asc", "price_desc", "rating"];
/** Sentinel for the "All brands" option (Base UI Select treats null as "nothing selected"). */
const ALL_BRANDS = "__all";

interface Props {
  total: number;
  /** brand filter options; omit (or pass empty) to hide the brand select, e.g. on /b/<slug> pages */
  brands?: { slug: string; name: string }[];
}

export function ShopToolbar({ total, brands }: Props) {
  const t = useTranslations("shop");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const sortId = useId();
  const brandId = useId();
  const currentSort = (params.get("sort") as ProductSort) || "newest";
  const currentBrand = params.get("brand") || ALL_BRANDS;
  const sortItems = SORTS.map((s) => ({ value: s, label: t(`sort_${s}`) }));
  const brandItems = [{ value: ALL_BRANDS, label: t("allBrands") }, ...(brands ?? []).map((b) => ({ value: b.slug, label: b.name }))];

  // Every filter change resets pagination: page 1 of the new result set.
  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
      <span className="text-muted-foreground">{t("results", { count: total })}</span>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {brands && brands.length > 0 && (
          <div className="flex items-center gap-2">
            <Label htmlFor={brandId} className="text-muted-foreground">
              {t("brand")}
            </Label>
            <Select
              items={brandItems}
              value={currentBrand}
              modal={false}
              onValueChange={(value) => {
                if (!value) return;
                update("brand", value === ALL_BRANDS ? null : String(value));
              }}
            >
              <SelectTrigger id={brandId} size="sm" aria-label={t("brand")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" alignItemWithTrigger={false}>
                {brandItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Label htmlFor={sortId} className="text-muted-foreground">
            {t("sort")}
          </Label>
          <Select
            items={sortItems}
            value={currentSort}
            modal={false}
            onValueChange={(value) => {
              if (!value) return;
              update("sort", String(value));
            }}
          >
            <SelectTrigger id={sortId} size="sm" aria-label={t("sort")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" alignItemWithTrigger={false}>
              {sortItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
