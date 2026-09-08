"use client";

import { useId } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { ProductSort } from "@/lib/catalog/types";

const SORTS: ProductSort[] = ["newest", "price_asc", "price_desc", "rating"];

export function ShopToolbar({ total }: { total: number }) {
  const t = useTranslations("shop");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const id = useId();
  const current = (params.get("sort") as ProductSort) || "newest";
  const items = SORTS.map((s) => ({ value: s, label: t(`sort_${s}`) }));

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{t("results", { count: total })}</span>
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="text-muted-foreground">
          {t("sort")}
        </Label>
        <Select
          items={items}
          value={current}
          modal={false}
          onValueChange={(value) => {
            if (!value) return;
            const next = new URLSearchParams(params.toString());
            next.set("sort", String(value));
            next.delete("page");
            router.replace(`${pathname}?${next.toString()}`);
          }}
        >
          <SelectTrigger id={id} size="sm" aria-label={t("sort")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" alignItemWithTrigger={false}>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
