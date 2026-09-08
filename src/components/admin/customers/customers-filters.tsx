"use client";

import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MarketingFilter } from "@/lib/admin/customers/types";
import { TableToolbar, useListNavigation } from "../shared/table-toolbar";

const ALL = "all";

export function CustomersFilters({ marketing }: { marketing?: MarketingFilter }) {
  const t = useTranslations("admin.customers");
  const { setParam } = useListNavigation();
  const items = [
    { value: ALL, label: t("filterAll") },
    { value: "yes", label: t("filterSubscribed") },
    { value: "no", label: t("filterUnsubscribed") },
  ];
  return (
    <TableToolbar searchPlaceholder={t("searchPlaceholder")}>
      <Select items={items} value={marketing ?? ALL} modal={false} onValueChange={(v) => setParam("marketing", !v || v === ALL ? null : String(v))}>
        <SelectTrigger aria-label={t("filterMarketing")} className="w-full sm:w-48">
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
  );
}
