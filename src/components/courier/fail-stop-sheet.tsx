"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { failStopAction, type CourierActionState } from "@/lib/courier/actions";
import type { CourierStop } from "@/lib/courier/context";
import { FAILURE_REASONS } from "@/lib/admin/delivery/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  stop: CourierStop;
}

/** Nobody home. The stop fails; the order stays shipped and staff decide what happens next. */
export function FailStopSheet({ open, onOpenChange, token, stop }: Props) {
  const t = useTranslations("courier");
  const [state, action, pending] = useActionState(failStopAction, {} as CourierActionState);

  useEffect(() => {
    if (state.ok) onOpenChange(false);
  }, [state.ok, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
        <SheetTitle>{t("fail.title")}</SheetTitle>
        <form action={action} className="flex flex-col gap-4 p-4 pt-0">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="deliveryId" value={stop.id} />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">{t("fail.reason")}</legend>
            {FAILURE_REASONS.map((reason, i) => (
              <label key={reason} className="flex items-center gap-3 rounded-lg border p-3 text-sm has-checked:border-primary has-checked:bg-primary/5">
                <input type="radio" name="reason" value={reason} required defaultChecked={i === 0} className="size-4 accent-[var(--primary)]" />
                {t(`failureReason.${reason}`)}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`fail-note-${stop.id}`}>{t("fail.note")}</Label>
            <Textarea id={`fail-note-${stop.id}`} name="note" rows={2} maxLength={300} />
          </div>
          {state.error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {t(`errors.${state.error}`)}
            </p>
          )}
          <Button type="submit" size="xl" variant="destructive" disabled={pending}>
            {t("fail.submit")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
