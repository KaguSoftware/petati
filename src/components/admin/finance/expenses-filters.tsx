"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ExpenseCategoryRow } from "@/lib/admin/finance/types";
import { DateRangePicker } from "../shared/date-range-picker";
import { TableToolbar, useListNavigation } from "../shared/table-toolbar";

interface Props {
  categories: ExpenseCategoryRow[];
  /** Current `category` param: an id, "none", or undefined for all. */
  current?: string;
  /** Right-aligned actions (the "Add expense" dialog trigger). */
  children?: ReactNode;
}

const ALL = "all";
const NONE = "none";

/** Search + date range + category filter for the expenses list. */
export function ExpensesFilters({ categories, current, children }: Props) {
  const t = useTranslations("admin.finance");
  const { setParam } = useListNavigation();
  const items = [
    { value: ALL, label: t("table.allCategories") },
    { value: NONE, label: t("byCategory.uncategorized") },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];
  const value = items.some((i) => i.value === current) ? (current as string) : ALL;

  return (
    <TableToolbar searchPlaceholder={t("table.searchPlaceholder")} actions={children}>
      <DateRangePicker />
      <Select value={value} onValueChange={(v) => setParam("category", v === ALL || v == null ? null : String(v))} items={items}>
        <SelectTrigger size="sm" className="min-w-44" aria-label={t("table.filterCategory")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
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
