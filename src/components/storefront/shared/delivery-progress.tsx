import { getTranslations } from "next-intl/server";
import type { CustomerDeliveryView } from "@/lib/account/delivery";
import { dateTimeFormat } from "@/lib/number";

/** The shopper's view of their parcel's journey: attempts, who has it, and how it was confirmed. */
export async function DeliveryProgress({ attempts, locale }: { attempts: CustomerDeliveryView[]; locale: string }) {
  const t = await getTranslations("order");
  const tf = await getTranslations("courier.failureReason");
  if (attempts.length === 0) return null;
  const date = dateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <section className="flex flex-col gap-2 rounded-xl border p-4">
      <h2 className="font-medium">{t("delivery")}</h2>
      <ol className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        {attempts.map((a) => (
          <li key={a.attempt}>
            <span className="text-foreground">{t("attemptLine", { n: a.attempt })}</span>{" "}
            {a.state === "delivered"
              ? `· ${t("deliveredTo", { name: a.recipientName ?? "" })} · ${a.verified ? t("withCode") : t("withoutCode")}`
              : a.state === "failed"
                ? `· ${tf(a.failureReason ?? "other")}`
                : a.state === "out_for_delivery"
                  ? `· ${t("outForDelivery")}${a.courierFirstName ? ` (${a.courierFirstName})` : ""}`
                  : a.scheduledFor
                    ? `· ${t("scheduled", { date: date.format(new Date(a.scheduledFor)) })}`
                    : ""}
            {a.at ? ` · ${date.format(new Date(a.at))}` : ""}
          </li>
        ))}
      </ol>
    </section>
  );
}
