import { AlertTriangle, Camera, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { StatusBadge } from "../shared/status-badge";
import type { DeliveryEventRow, DeliveryRow } from "@/lib/db/types";
import { formatMoney } from "@/lib/money";
import { RedeliverButton } from "./redeliver-button";

type Attempt = DeliveryRow & { courier_name: string | null; events: DeliveryEventRow[] };

interface Props {
  storeId: string;
  attempts: Attempt[];
  locale: string;
  currency: string;
  canAssign: boolean;
  /** Signed, short-lived URLs for proof photos, keyed by delivery id. */
  photoUrls: Record<string, string>;
}

/**
 * What happened to this parcel, in the admin. Sits beside the delivery-code card so "who is taking
 * it" and "what the customer must say" read as one block.
 */
export async function OrderDeliveryCard({ storeId, attempts, locale, currency, canAssign, photoUrls }: Props) {
  const t = await getTranslations("admin.delivery");
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const day = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  if (attempts.length === 0) return null;
  const latest = attempts[0];

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">{t("title")}</h2>
        <StatusBadge kind="delivery" value={latest.state} />
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">{t("courier")}</dt>
        <dd>{latest.courier_name ?? <span className="text-muted-foreground">{t("noCourier")}</span>}</dd>
        {latest.scheduled_for && (
          <>
            <dt className="text-muted-foreground">{t("scheduledFor")}</dt>
            <dd className="tabular-nums">{day.format(new Date(latest.scheduled_for))}</dd>
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
      </dl>

      {latest.state === "delivered" && !latest.verified && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {t("unverified")}
          {latest.note ? ` · ${latest.note}` : ""}
        </p>
      )}

      {photoUrls[latest.id] && (
        <a href={photoUrls[latest.id]} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground underline underline-offset-4">
          <Camera className="size-3.5" />
          {t("proofPhoto")}
        </a>
      )}
      {latest.lat !== null && latest.lng !== null && (
        <a
          href={`https://maps.google.com/?q=${latest.lat},${latest.lng}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-xs text-muted-foreground underline underline-offset-4"
        >
          <MapPin className="size-3.5" />
          {t("proofLocation")}
        </a>
      )}

      {attempts.length > 1 && (
        <ol className="flex flex-col gap-1 border-t pt-2 text-xs text-muted-foreground">
          {attempts.slice(1).map((a) => (
            <li key={a.id}>
              {t("attempt")} {a.attempt_no} ·{" "}
              {a.failure_reason ? t(`failureReason.${a.failure_reason}`) : t(`bucket.${a.state === "delivered" ? "done" : "failed"}`)}
              {a.completed_at ? ` · ${date.format(new Date(a.completed_at))}` : ""}
            </li>
          ))}
        </ol>
      )}

      {canAssign && (latest.state === "failed" || latest.state === "returned") && (
        <RedeliverButton storeId={storeId} deliveryId={latest.id} label={t("redeliver")} />
      )}
      <Link href="/admin/delivery" className="text-center text-xs text-muted-foreground underline underline-offset-4">
        {t("title")}
      </Link>
    </section>
  );
}
