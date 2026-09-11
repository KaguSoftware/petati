"use client";

import { useState } from "react";
import { Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignDeliveriesAction } from "@/lib/admin/delivery/actions";
import { useOptimisticAction } from "../shared/use-optimistic-action";

interface Props {
  storeId: string;
  orderId: string;
  couriers: { id: string; name: string }[];
  today: string;
  tomorrow: string;
  slots: { key: string; label: string }[];
}

/** "No courier yet" → pick one and a day, and the order is a stop on their run. Same action as the board. */
export function AssignInline({ storeId, orderId, couriers, today, tomorrow, slots }: Props) {
  const t = useTranslations("admin.delivery");
  const { run, pending } = useOptimisticAction("admin.delivery");
  const [courierId, setCourierId] = useState(couriers[0]?.id ?? "");
  const [day, setDay] = useState(tomorrow);
  const [slot, setSlot] = useState(slots[0]?.key ?? "");

  function assign() {
    if (!courierId) return;
    const fd = new FormData();
    fd.set("storeId", storeId);
    fd.set("courierId", courierId);
    fd.set("scheduledFor", day);
    if (slot) fd.set("slot", slot);
    fd.append("orderIds", orderId);
    run(() => assignDeliveriesAction({}, fd), { onSuccess: () => toast.success(t("assignInline.done")) });
  }

  if (couriers.length === 0) return <p className="text-sm text-muted-foreground">{t("assignInline.noCouriers")}</p>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={courierId} onValueChange={(v) => setCourierId(v ?? "")}>
        <SelectTrigger size="sm" className="min-w-36 flex-1" aria-label={t("bulk.pickCourier")}>
          <SelectValue>{couriers.find((c) => c.id === courierId)?.name ?? t("bulk.pickCourier")}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {couriers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={day} onValueChange={(v) => setDay(v ?? today)}>
        <SelectTrigger size="sm" className="w-28">
          <SelectValue>{day === today ? t("date.today") : t("date.tomorrow")}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={today}>{t("date.today")}</SelectItem>
          <SelectItem value={tomorrow}>{t("date.tomorrow")}</SelectItem>
        </SelectContent>
      </Select>
      {slots.length > 0 && (
        <Select value={slot} onValueChange={(v) => setSlot(v ?? "")}>
          <SelectTrigger size="sm" className="w-32">
            <SelectValue>{slots.find((s) => s.key === slot)?.label ?? ""}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {slots.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button type="button" size="sm" disabled={pending || !courierId} onClick={assign}>
        <Truck data-icon="inline-start" />
        {t("assign")}
      </Button>
    </div>
  );
}
