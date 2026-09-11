"use client";

import { Truck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/lib/db/types";
import { ORDER_STATUSES } from "@/lib/admin/orders/transitions";
import { DateRangePicker } from "../shared/date-range-picker";
import { EntityLink } from "../shared/entity-link";
import { StatusTabs } from "../shared/status-tabs";
import { TableToolbar, useListNavigation } from "../shared/table-toolbar";

interface Props {
  counts: Partial<Record<OrderStatus | "all", number>>;
  current?: OrderStatus;
  /** Active courier filter (arrives by link from a courier page); shown as a removable chip. */
  courier?: { id: string; name: string };
}

/** Search + date range (shared by the preloaded-tabs and the server-filtered list). */
export function OrdersToolbar({ courier }: { courier?: { id: string; name: string } }) {
  const t = useTranslations("admin");
  const { setParam } = useListNavigation();
  return (
    <TableToolbar searchPlaceholder={t("orders.searchPlaceholder")}>
      <DateRangePicker />
      {courier && (
        <Badge variant="outline" className="gap-1.5 py-1 pe-1 text-sm font-normal">
          <Truck className="size-3.5" />
          {t("orders.courierFilter")} <EntityLink kind="courier" id={courier.id} label={courier.name} />
          <Button type="button" variant="ghost" size="icon-xs" aria-label={t("orders.clearCourier")} onClick={() => setParam("courier", null)}>
            <X />
          </Button>
        </Badge>
      )}
    </TableToolbar>
  );
}

/** Server-filtered mode (search/date/page active): status tabs navigate. */
export function OrdersFilters({ counts, current, courier }: Props) {
  const t = useTranslations("admin");
  const { setParam } = useListNavigation();
  const items = [
    { value: "all", label: t("common.all"), count: counts.all ?? 0 },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: t(`status.order.${s}`), count: counts[s] ?? 0 })),
  ];
  return (
    <div className="flex flex-col gap-3">
      <StatusTabs label={t("common.status")} value={current ?? "all"} items={items} onValueChange={(v) => setParam("status", v === "all" ? null : v)} />
      <OrdersToolbar courier={courier} />
    </div>
  );
}
