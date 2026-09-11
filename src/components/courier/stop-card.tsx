"use client";

import { useState } from "react";
import { CheckCircle2, MapPin, Phone, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CourierStop } from "@/lib/courier/context";
import { formatMoney } from "@/lib/money";
import { ConfirmStopSheet } from "./confirm-stop-sheet";
import { FailStopSheet } from "./fail-stop-sheet";

interface Props {
  token: string;
  stop: CourierStop;
  locale: string;
  codEnabled: boolean;
}

/** One doorstep. Everything the courier needs to get there, ring the bell and close the stop. */
export function StopCard({ token, stop, locale, codEnabled }: Props) {
  const t = useTranslations("courier");
  const [sheet, setSheet] = useState<"confirm" | "fail" | null>(null);
  const open = stop.state === "assigned" || stop.state === "out_for_delivery";
  const a = stop.address;
  const money = (n: number) => formatMoney(n, stop.currency, locale);
  const mapQuery = a ? encodeURIComponent([a.line1, a.line2, a.postal_code, a.city, a.country].filter(Boolean).join(", ")) : "";

  return (
    <article className={`flex flex-col gap-3 rounded-xl border bg-card p-4 ${open ? "" : "opacity-70"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{stop.customer_name ?? a?.full_name ?? "—"}</p>
          <p dir="ltr" className="truncate text-xs text-muted-foreground tabular-nums">
            {stop.order_number}
            {stop.attempt_no > 1 ? ` · ${t("attempt", { n: stop.attempt_no })}` : ""}
          </p>
        </div>
        {open ? (
          stop.cash_expected > 0 && codEnabled ? (
            <Badge className="shrink-0 bg-primary text-primary-foreground">{t("collect", { amount: money(stop.cash_expected) })}</Badge>
          ) : (
            <Badge variant="secondary" className="shrink-0">
              {t("paidOnline")}
            </Badge>
          )
        ) : (
          <Badge variant={stop.state === "delivered" ? "secondary" : "destructive"} className="shrink-0">
            {t(stop.state === "delivered" ? "delivered" : "failed")}
          </Badge>
        )}
      </div>

      {a && (
        <address className="text-sm not-italic text-muted-foreground">
          {a.line1}
          {a.line2 ? `, ${a.line2}` : ""}
          <br />
          {a.postal_code} {a.city}
        </address>
      )}

      {stop.customer_note && <p className="rounded-lg bg-muted/60 p-2 text-sm">{stop.customer_note}</p>}

      <div className="flex flex-wrap gap-2">
        {a && (
          <a
            href={`https://maps.google.com/?q=${mapQuery}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium"
          >
            <MapPin className="size-4" />
            {t("navigate")}
          </a>
        )}
        {stop.phone && (
          <a href={`tel:${stop.phone}`} className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium">
            <Phone className="size-4" />
            <span dir="ltr">{stop.phone}</span>
          </a>
        )}
      </div>

      {open ? (
        <div className="flex gap-2">
          <Button type="button" size="lg" className="flex-1" onClick={() => setSheet("confirm")}>
            <CheckCircle2 data-icon="inline-start" />
            {t("deliver")}
          </Button>
          <Button type="button" size="lg" variant="outline" onClick={() => setSheet("fail")}>
            <XCircle data-icon="inline-start" />
            {t("failed")}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {stop.state === "delivered"
            ? t(stop.verified ? "closedWithCode" : "closedWithoutCode", { name: stop.recipient_name ?? "" })
            : t(`failureReason.${stop.failure_reason ?? "other"}`)}
        </p>
      )}

      <ConfirmStopSheet
        open={sheet === "confirm"}
        onOpenChange={(v) => setSheet(v ? "confirm" : null)}
        token={token}
        stop={stop}
        codEnabled={codEnabled}
      />
      <FailStopSheet open={sheet === "fail"} onOpenChange={(v) => setSheet(v ? "fail" : null)} token={token} stop={stop} />
    </article>
  );
}
