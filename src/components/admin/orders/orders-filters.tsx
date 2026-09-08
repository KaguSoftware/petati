"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverlayScroll } from "@/components/ui/overlay-scroll";
import type { OrderStatus } from "@/lib/db/types";
import { ORDER_STATUSES } from "@/lib/admin/orders/transitions";
import { DateRangePicker } from "../shared/date-range-picker";
import { TableToolbar, useListNavigation } from "../shared/table-toolbar";

interface Props {
  counts: Partial<Record<OrderStatus | "all", number>>;
  current?: OrderStatus;
}

export function OrdersFilters({ counts, current }: Props) {
  const t = useTranslations("admin");
  const { setParam } = useListNavigation();
  const fmt = new Intl.NumberFormat();
  return (
    <div className="flex flex-col gap-3">
      <OverlayScroll axis="x" className="-mx-1 px-1">
        <Tabs value={current ?? "all"} onValueChange={(v) => setParam("status", v === "all" ? null : String(v))}>
          <TabsList className="w-max">
            <TabsTrigger value="all">
              {t("common.all")}
              <span className="ms-1 text-xs text-muted-foreground tabular-nums">{fmt.format(counts.all ?? 0)}</span>
            </TabsTrigger>
            {ORDER_STATUSES.map((s) => (
              <TabsTrigger key={s} value={s}>
                {t(`status.order.${s}`)}
                <span className="ms-1 text-xs text-muted-foreground tabular-nums">{fmt.format(counts[s] ?? 0)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </OverlayScroll>
      <TableToolbar searchPlaceholder={t("orders.searchPlaceholder")}>
        <DateRangePicker />
      </TableToolbar>
    </div>
  );
}
