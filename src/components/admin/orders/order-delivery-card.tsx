import { AlertTriangle, Camera, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { DeliveryEventRow, DeliveryRow } from "@/lib/db/types";
import type { DeliverySlot } from "@/lib/delivery/settings";
import { slotLabel } from "@/lib/delivery/settings";
import { formatMoney } from "@/lib/money";
import { DeliveryRowActions } from "../delivery/delivery-row-actions";
import { EntityLink } from "../shared/entity-link";
import { OptimisticStatusBadge } from "../shared/optimistic-status-badge";
import { AssignInline } from "./assign-inline";

type Attempt = DeliveryRow & { courier_name: string | null; events: DeliveryEventRow[] };

interface Props {
  storeId: string;
  orderId: string;
  attempts: Attempt[];
  locale: string;
  currency: string;
  canAssign: boolean;
  /** Signed, short-lived URLs for proof photos, keyed by delivery id. */
  photoUrls: Record<string, string>;
  /** The order can be delivered but has no stop yet: offer to assign one right here. */
  deliverable: boolean;
  couriers: { id: string; name: string }[];
  today: string;
  tomorrow: string;
  slots: DeliverySlot[];
}

/**
 * What happened to this parcel, in the admin. Sits beside the delivery-code card so "who is taking
 * it" and "what the customer must say" read as one block. An order with no stop yet gets the
 * assign controls instead of nothing, so dispatch can start from the order too.
 */
export async function OrderDeliveryCard({ storeId, orderId, attempts, locale, currency, canAssign, photoUrls, deliverable, couriers, today, tomorrow, slots }: Props) {
  const t = await getTranslations("admin.delivery");
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const day = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const latest = attempts[0];
  const open = latest && (latest.state === "pending" || latest.state === "assigned" || latest.state === "out_for_delivery");
  if (!latest && !deliverable) return null;

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">{t("title")}</h2>
        {latest ? <OptimisticStatusBadge id={latest.id} kind="delivery" value={latest.state} field="state" /> : <span className="text-xs text-muted-foreground">{t("orderCard.noDelivery")}</span>}
      </div>

      {!latest || (!open && deliverable && latest.state !== "delivered") ? (
        canAssign ? (
          <AssignInline storeId={storeId} orderId={orderId} couriers={couriers} today={today} tomorrow={tomorrow} slots={slots.map((s) => ({ key: s.key, label: slotLabel(s, locale, locale) }))} />
        ) : (
          <p className="text-sm text-muted-foreground">{t("noCourier")}</p>
        )
      ) : null}

      {latest && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">{t("courier")}</dt>
          <dd>{latest.courier_id && latest.courier_name ? <EntityLink kind="courier" id={latest.courier_id} label={latest.courier_name} /> : <span className="text-muted-foreground">{t("noCourier")}</span>}</dd>
          {latest.scheduled_for && (
            <>
              <dt className="text-muted-foreground">{t("scheduledFor")}</dt>
              <dd className="tabular-nums">
                {latest.courier_id ? (
                  <EntityLink kind="run" id={latest.courier_id} query={`d=${latest.scheduled_for}`} label={day.format(new Date(latest.scheduled_for))} className="font-normal" />
                ) : (
                  day.format(new Date(latest.scheduled_for))
                )}
                {latest.slot ? ` · ${slotLabel(slots.find((s) => s.key === latest.slot) ?? { key: latest.slot, label: {}, from: "", to: "" }, locale, locale)}` : ""}
              </dd>
            </>
          )}
          {latest.cash_expected > 0 && (
            <>
              <dt className="text-muted-foreground">{t("cashLabel")}</dt>
              <dd className="tabular-nums">
                {formatMoney(latest.cash_collected ?? 0, currency, locale)}
                <span className="text-muted-foreground"> / {formatMoney(latest.cash_expected, currency, locale)}</span>
              </dd>
            </>
          )}
          {latest.recipient_name && (
            <>
              <dt className="text-muted-foreground">{t("recipient")}</dt>
              <dd>{latest.recipient_name}</dd>
            </>
          )}
          {latest.completed_at && (
            <>
              <dt className="text-muted-foreground">{t(`bucket.${latest.state === "delivered" ? "done" : "failed"}`)}</dt>
              <dd className="tabular-nums">{date.format(new Date(latest.completed_at))}</dd>
            </>
          )}
        </dl>
      )}

      {latest?.state === "delivered" && !latest.verified && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {t("unverified")}
          {latest.note ? ` · ${latest.note}` : ""}
        </p>
      )}
      {latest?.state === "failed" && latest.failure_reason && <p className="text-xs text-destructive">{t(`failureReason.${latest.failure_reason}`)}{latest.note ? ` · ${latest.note}` : ""}</p>}

      {latest && photoUrls[latest.id] && (
        <a href={photoUrls[latest.id]} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground underline underline-offset-4">
          <Camera className="size-3.5" />
          {t("proofPhoto")}
        </a>
      )}
      {latest && latest.lat !== null && latest.lng !== null && (
        <a href={`https://maps.google.com/?q=${latest.lat},${latest.lng}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground underline underline-offset-4">
          <MapPin className="size-3.5" />
          {t("proofLocation")}
        </a>
      )}

      {attempts.length > 1 && (
        <ol className="flex flex-col gap-1 border-t pt-2 text-xs text-muted-foreground">
          {attempts.slice(1).map((a) => (
            <li key={a.id}>
              {t("attempt")} {a.attempt_no} · {a.failure_reason ? t(`failureReason.${a.failure_reason}`) : t(`bucket.${a.state === "delivered" ? "done" : "failed"}`)}
              {a.completed_at ? ` · ${date.format(new Date(a.completed_at))}` : ""}
              {a.courier_id && a.courier_name ? (
                <>
                  {" · "}
                  <EntityLink kind="courier" id={a.courier_id} label={a.courier_name} muted className="font-normal" />
                </>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      {latest && canAssign && (
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <DeliveryRowActions
            storeId={storeId}
            variant="inline"
            delivery={{ id: latest.id, orderId, state: latest.state, verified: latest.verified, courierId: latest.courier_id, scheduledFor: latest.scheduled_for, cashExpected: latest.cash_expected, currency }}
          />
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <Link href={latest ? `/admin/delivery?bucket=${bucketFor(latest.state)}` : "/admin/delivery"} className="underline underline-offset-4">
          {t("orderCard.openBoard")}
        </Link>
        {latest && (
          <Link href={`/admin/delivery/log?order=${orderId}`} className="underline underline-offset-4">
            {t("orderCard.log")}
          </Link>
        )}
      </div>
    </section>
  );
}

function bucketFor(state: DeliveryRow["state"]): string {
  if (state === "pending" || state === "assigned") return "assigned";
  if (state === "out_for_delivery") return "out_for_delivery";
  if (state === "failed" || state === "returned") return "failed";
  return "done";
}
