import { getTranslations } from "next-intl/server";
import type { OrderEventWithActor } from "@/lib/admin/orders/queries";
import { formatMoney } from "@/lib/money";

interface Props {
  events: OrderEventWithActor[];
  locale: string;
  currency: string;
}

export async function OrderTimeline({ events, locale, currency }: Props) {
  const t = await getTranslations("admin");
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const describe = (e: OrderEventWithActor): string => {
    const d = e.data ?? {};
    switch (e.type) {
      case "placed":
        return t("orders.timeline.placed");
      case "status_changed":
        return t("orders.timeline.status_changed", { from: t(`status.order.${String(d.from)}`), to: t(`status.order.${String(d.to)}`) });
      case "payment":
        return d.reference ? t("orders.timeline.paymentRef", { ref: String(d.reference) }) : t("orders.timeline.payment");
      case "shipment":
        return d.tracking_number ? t("orders.timeline.shipmentTracking", { number: String(d.tracking_number) }) : t("orders.timeline.shipment");
      case "refund":
        return t("orders.timeline.refund", { amount: formatMoney(Number(d.amount ?? 0), currency, locale) });
      case "note":
        return t("orders.timeline.note");
      default:
        return e.type;
    }
  };
  if (events.length === 0) return <p className="text-sm text-muted-foreground">{t("common.none")}</p>;
  return (
    <ol className="relative flex flex-col gap-4 border-s ps-4">
      {events.map((e) => (
        <li key={e.id} className="relative text-sm">
          <span aria-hidden className="absolute -start-[21px] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />
          <p>{describe(e)}</p>
          <p className="text-xs text-muted-foreground">
            {date.format(new Date(e.created_at))}
            {e.profiles?.full_name ? ` · ${e.profiles.full_name}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
