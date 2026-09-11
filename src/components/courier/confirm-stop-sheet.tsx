"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { LatinInput } from "@/components/forms/latin-input";
import { confirmStopAction, type CourierActionState } from "@/lib/courier/actions";
import type { CourierStop } from "@/lib/courier/context";
import { toMajor } from "@/lib/money";
import { ProofPhotoField } from "./proof-photo-field";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  stop: CourierStop;
  codEnabled: boolean;
}

/**
 * The handover. The code is the clean path; "no code" is the honest escape hatch for a customer who
 * cannot find their email, and it costs a reason plus an amber flag in the admin.
 */
export function ConfirmStopSheet({ open, onOpenChange, token, stop, codEnabled }: Props) {
  const t = useTranslations("courier");
  const [state, action, pending] = useActionState(confirmStopAction, {} as CourierActionState);
  const [noCode, setNoCode] = useState(false);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const collectable = codEnabled && stop.cash_expected > 0;

  // Ask for a fix while the courier is reading the form, not while they are waiting to leave.
  useEffect(() => {
    if (!open || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setGps({ lat: p.coords.latitude, lng: p.coords.longitude }),
      // Denied, timed out, or no signal: the confirm must still work. A parcel in a hand beats a fix.
      () => setGps(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  }, [open]);

  useEffect(() => {
    if (state.ok) onOpenChange(false);
  }, [state.ok, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
        <SheetTitle>{t("confirm.title")}</SheetTitle>
        <form action={action} className="flex flex-col gap-4 p-4 pt-0">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="deliveryId" value={stop.id} />
          {photoPath && <input type="hidden" name="photoPath" value={photoPath} />}
          {gps && (
            <>
              <input type="hidden" name="lat" value={gps.lat} />
              <input type="hidden" name="lng" value={gps.lng} />
            </>
          )}

          {!noCode ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor={`code-${stop.id}`}>{t("confirm.code")}</Label>
              <LatinInput
                kind="code"
                id={`code-${stop.id}`}
                name="code"
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="off"
                placeholder="000000"
                className="h-14 text-center text-2xl tracking-[0.4em] tabular-nums"
              />
              <p className="text-xs text-muted-foreground">
                {t("confirm.codeHint")}
                {stop.code_tries_left <= 2 ? ` · ${t("confirm.triesLeft", { count: state.triesLeft ?? stop.code_tries_left })}` : ""}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor={`reason-${stop.id}`}>{t("noCode.reason")}</Label>
              <Input id={`reason-${stop.id}`} name="noCodeReason" required minLength={3} maxLength={300} placeholder={t("noCode.placeholder")} />
              <p className="text-xs text-amber-700 dark:text-amber-300">{t("noCode.warning")}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor={`recipient-${stop.id}`}>{t("confirm.recipient")}</Label>
            <Input id={`recipient-${stop.id}`} name="recipientName" required maxLength={120} defaultValue={stop.customer_name ?? ""} />
          </div>

          {collectable && (
            <div className="flex flex-col gap-2">
              <Label htmlFor={`cash-${stop.id}`}>{t("confirm.cash")}</Label>
              <Input
                id={`cash-${stop.id}`}
                name="cashCollected"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                dir="ltr"
                defaultValue={stop.cash_expected}
                className="h-12 text-lg tabular-nums"
              />
              <p className="text-xs text-muted-foreground">{t("confirm.cashHint", { amount: String(toMajor(stop.cash_expected, stop.currency)) })}</p>
            </div>
          )}

          <ProofPhotoField token={token} deliveryId={stop.id} onUploaded={setPhotoPath} />

          <div className="flex flex-col gap-2">
            <Label htmlFor={`note-${stop.id}`}>{t("confirm.note")}</Label>
            <Textarea id={`note-${stop.id}`} name="note" rows={2} maxLength={300} />
          </div>

          <p className="text-xs text-muted-foreground">{gps ? t("confirm.gpsOn") : t("confirm.gpsOff")}</p>

          {state.error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {t(`errors.${state.error}`)}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Button type="submit" size="xl" disabled={pending}>
              {t("confirm.submit")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setNoCode((v) => !v)}>
              {t(noCode ? "noCode.back" : "noCode.toggle")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
