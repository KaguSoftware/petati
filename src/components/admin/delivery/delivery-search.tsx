"use client";

import { useActionState, useRef, useState } from "react";
import { CheckCircle2, Search, ShieldCheck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { confirmDeliveryByCodeAction } from "@/lib/admin/orders/actions";
import { lookupDeliveryAction } from "@/lib/admin/delivery/actions";
import type { LookupMatch } from "@/lib/admin/delivery/queries";
import type { ActionState } from "@/lib/admin/types";
import { formatMoney } from "@/lib/money";
import { StatusBadge } from "../shared/status-badge";
import { useOptimisticAction } from "../shared/use-optimistic-action";

type State = ActionState & { matches?: LookupMatch[]; query?: string };

interface Props {
  storeId: string;
  canConfirm: boolean;
  locale: string;
}

/**
 * The way into the module. A delivery code is an identifier, so it is the thing you search WITH:
 * type the six digits a customer reads out on the phone and their parcel is on screen with its
 * actions, no navigating and no hunting through buckets. Order numbers, phones and emails work too.
 *
 * When the query was the CODE and it matched, the searcher has already proved it — so closing the
 * stop is one button, not a dialog asking for the code they just typed.
 */
export function DeliverySearch({ storeId, canConfirm, locale }: Props) {
  const t = useTranslations("admin.delivery.search");
  const [state, action, pending] = useActionState(lookupDeliveryAction, {} as State);
  const formRef = useRef<HTMLFormElement>(null);
  const { run, pending: confirming } = useOptimisticAction("admin.orders");
  const [dismissed, setDismissed] = useState(false);

  function confirm(match: LookupMatch) {
    const fd = new FormData();
    fd.set("storeId", storeId);
    fd.set("orderId", match.orderId);
    fd.set("code", state.query ?? "");
    run(() => confirmDeliveryByCodeAction({}, fd), {
      onSuccess: () => {
        toast.success(t("confirmed", { number: match.orderNumber }));
        formRef.current?.requestSubmit();
      },
    });
  }

  const matches = dismissed ? [] : (state.matches ?? []);
  const searched = Boolean(state.query) && !dismissed;

  return (
    <section className="flex flex-col gap-3">
      <form ref={formRef} action={action} onSubmit={() => setDismissed(false)} className="flex gap-2">
        <input type="hidden" name="storeId" value={storeId} />
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="query"
            defaultValue={state.query}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            autoComplete="off"
            className="h-11 ps-9 text-base"
          />
        </div>
        <Button type="submit" size="lg" disabled={pending}>
          {t("submit")}
        </Button>
      </form>

      {searched && matches.length === 0 && !pending && <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">{t("none")}</p>}

      {matches.map((m) => (
        <article key={m.orderId} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
          <div className="min-w-40 flex-1">
            <p className="flex flex-wrap items-center gap-2">
              <Link href={`/admin/orders/${m.orderId}`} className="font-medium tabular-nums hover:underline" dir="ltr">
                {m.orderNumber}
              </Link>
              <StatusBadge kind="order" value={m.orderStatus} />
              {m.deliveryState && <StatusBadge kind="delivery" value={m.deliveryState} />}
              {m.matchedByCode && (
                <Badge className="gap-1 bg-primary/10 text-primary">
                  <ShieldCheck className="size-3" />
                  {t("codeMatched")}
                </Badge>
              )}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {[m.customerName, m.address, m.courierName].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>

          {m.cashExpected > 0 && (
            <span className="text-sm font-medium tabular-nums">
              {formatMoney(m.cashCollected ?? m.cashExpected, m.currency, locale)}
            </span>
          )}

          {m.phone && (
            <a href={`tel:${m.phone}`} className="text-sm text-muted-foreground hover:underline" dir="ltr">
              {m.phone}
            </a>
          )}

          {/* The payoff: the code was typed and matched, so there is nothing left to prove. */}
          {canConfirm && m.matchedByCode && m.canConfirm && (
            <Button type="button" size="sm" disabled={confirming} onClick={() => confirm(m)}>
              <CheckCircle2 data-icon="inline-start" />
              {t("confirm")}
            </Button>
          )}
          {m.matchedByCode && m.triesLeft === 0 && <span className="text-xs font-medium text-destructive">{t("locked")}</span>}
        </article>
      ))}

      {matches.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => {
            formRef.current?.reset();
            setDismissed(true);
          }}
        >
          <X data-icon="inline-start" />
          {t("clear")}
        </Button>
      )}
    </section>
  );
}
