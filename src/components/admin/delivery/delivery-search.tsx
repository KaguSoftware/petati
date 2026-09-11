"use client";

import { useActionState, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { confirmDeliveryByCodeAction } from "@/lib/admin/orders/actions";
import { lookupDeliveryAction } from "@/lib/admin/delivery/actions";
import type { LookupMatch } from "@/lib/admin/delivery/queries";
import type { ActionState } from "@/lib/admin/types";
import { OrderHit } from "../search/order-hit";
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
 * actions, no navigating and no hunting through buckets. Order numbers, phones, names and emails
 * work too. The same result card is used by the global search in the header.
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
            dir="auto"
            className="h-11 ps-9 text-base"
          />
        </div>
        <Button type="submit" size="lg" disabled={pending}>
          {t("submit")}
        </Button>
      </form>

      {searched && matches.length === 0 && !pending && <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">{t("none")}</p>}

      {matches.map((m) => (
        <OrderHit key={m.orderId} match={m} locale={locale} canConfirm={canConfirm} confirming={confirming} onConfirm={() => confirm(m)} className="rounded-xl border bg-card p-3" />
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
