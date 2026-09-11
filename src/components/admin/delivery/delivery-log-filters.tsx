"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOG_EVENT_TYPES } from "@/lib/admin/delivery/log-types";
import { EntityLink } from "../shared/entity-link";
import { useListNavigation } from "../shared/table-toolbar";

interface Props {
  couriers: { id: string; name: string }[];
  courierId?: string;
  type?: string;
  /** When the log is narrowed to one order, say which and offer a way back. */
  order?: { id: string; number: string };
}

/** Courier + event-type filters for the log; the order filter arrives by link and shows as a chip. */
export function DeliveryLogFilters({ couriers, courierId, type, order }: Props) {
  const t = useTranslations("admin.delivery");
  const { setParam, setParams } = useListNavigation();
  const ALL = "__all";
  const dirty = Boolean(courierId || type || order);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={courierId ?? ALL} onValueChange={(v) => setParam("courier", !v || v === ALL ? null : v)}>
        <SelectTrigger size="sm" className="w-44" aria-label={t("log.filters.courier")}>
          <SelectValue>{couriers.find((c) => c.id === courierId)?.name ?? t("log.filters.allCouriers")}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("log.filters.allCouriers")}</SelectItem>
          {couriers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={type ?? ALL} onValueChange={(v) => setParam("type", !v || v === ALL ? null : v)}>
        <SelectTrigger size="sm" className="w-44" aria-label={t("log.filters.type")}>
          <SelectValue>{type && t.has(`event.${type}`) ? t(`event.${type}`) : t("log.filters.allTypes")}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("log.filters.allTypes")}</SelectItem>
          {LOG_EVENT_TYPES.map((k) => (
            <SelectItem key={k} value={k}>
              {t(`event.${k}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {order && (
        <Badge variant="outline" className="gap-1.5 py-1 pe-1 text-sm font-normal">
          {t("log.filters.order")} <EntityLink kind="order" id={order.id} label={order.number} />
          <Button type="button" variant="ghost" size="icon-xs" aria-label={t("log.filters.clear")} onClick={() => setParam("order", null)}>
            <X />
          </Button>
        </Badge>
      )}
      {dirty && (
        <Button type="button" variant="ghost" size="sm" onClick={() => setParams({ courier: null, type: null, order: null })}>
          {t("log.filters.clear")}
        </Button>
      )}
    </div>
  );
}
