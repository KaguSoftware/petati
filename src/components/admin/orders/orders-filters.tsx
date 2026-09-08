"use client";

import { useTranslations } from "next-intl";
import type { OrderStatus } from "@/lib/db/types";
import { ORDER_STATUSES } from "@/lib/admin/orders/transitions";
import { DateRangePicker } from "../shared/date-range-picker";
import { StatusTabs } from "../shared/status-tabs";
import { TableToolbar, useListNavigation } from "../shared/table-toolbar";

interface Props {
  counts: Partial<Record<OrderStatus | "all", number>>;
  current?: OrderStatus;
}

export function OrdersFilters({ counts, current }: Props) {
  const t = useTranslations("admin");
  const { setParam } = useListNavigation();
  const items = [
    { value: "all", label: t("common.all"), count: counts.all ?? 0 },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: t(`status.order.${s}`), count: counts[s] ?? 0 })),
  ];
  return (
    <div className="flex flex-col gap-3">
      <StatusTabs label={t("common.status")} value={current ?? "all"} items={items} onValueChange={(v) => setParam("status", v === "all" ? null : v)} />
      <TableToolbar searchPlaceholder={t("orders.searchPlaceholder")}>
        <DateRangePicker />
      </TableToolbar>
    </div>
  );
}
