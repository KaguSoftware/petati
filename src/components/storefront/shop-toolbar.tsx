"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { ProductSort } from "@/lib/catalog/types";

const SORTS: ProductSort[] = ["newest", "price_asc", "price_desc", "rating"];

export function ShopToolbar({ total }: { total: number }) {
  const t = useTranslations("shop");
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const current = (params.get("sort") as ProductSort) || "newest";

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{t("results", { count: total })}</span>
      <label className="flex items-center gap-2">
        {t("sort")}
        <select
          className="rounded-md border bg-background px-2 py-1"
          value={current}
          onChange={(e) => {
            const next = new URLSearchParams(params.toString());
            next.set("sort", e.target.value);
            next.delete("page");
            router.replace(`${pathname}?${next.toString()}`);
          }}
        >
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {t(`sort_${s}`)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
