"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, MoreHorizontal, PackageX, RotateCcw, Route, ShieldCheck, Truck, Undo2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LatinInput } from "@/components/forms/latin-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { dispatchDeliveriesAction, redeliverAction, setDeliveryStateAction, unassignDeliveriesAction, verifyDeliveryAction } from "@/lib/admin/delivery/actions";
import { FAILURE_REASONS } from "@/lib/admin/delivery/types";
import { confirmDeliveryByCodeAction } from "@/lib/admin/orders/actions";
import type { DeliveryState } from "@/lib/db/types";
import { FormField } from "../shared/form-field";
import { MoneyInput } from "../shared/money-input";
import { clearOptimistic, setOptimistic, useOptimisticRow } from "../shared/optimistic-store";
import { useActionToast } from "../shared/use-action-toast";
import { useOptimisticAction } from "../shared/use-optimistic-action";

interface Props {
  storeId: string;
  delivery: { id: string; orderId: string; state: DeliveryState; verified: boolean; courierId: string | null; scheduledFor: string | null; cashExpected: number; currency: string };
  /** "menu" = the ⋯ button in a table row; "inline" = a labelled button on the order page. */
  variant?: "menu" | "inline";
}

type DialogKind = "code" | "noCode" | "failed" | "checked" | null;

/**
 * Everything staff can do to one stop, from the board or the order page. Closing a stop with the
 * customer's code goes through the same action as the search box and the order menu; closing it
 * without one goes through `setDeliveryStateAction`, which keeps it amber until somebody checks it.
 */
export function DeliveryRowActions({ storeId, delivery, variant = "menu" }: Props) {
  const t = useTranslations("admin.delivery");
  const tc = useTranslations("admin.common");
  const tro = useTranslations("admin.delivery.rowActions");
  const [dialog, setDialog] = useState<DialogKind>(null);
  const close = () => setDialog(null);
  const { state, verified } = useOptimisticRow(delivery.id, { state: delivery.state, verified: delivery.verified });
  const { run, pending } = useOptimisticAction("admin.delivery");
  const rollback = () => clearOptimistic(delivery.id, ["state", "verified"]);
  const [codeState, codeAction, codePending] = useActionToast(confirmDeliveryByCodeAction, {
    errorNamespace: "admin.orders",
    successMessage: tro("done"),
    onSuccess: close,
    onError: rollback,
  });
  const [stateFormState, stateFormAction, statePending] = useActionToast(setDeliveryStateAction, {
    errorNamespace: "admin.delivery",
    successMessage: tro("done"),
    onSuccess: close,
    onError: rollback,
  });
  const [checkedState, checkedAction, checkedPending] = useActionToast(verifyDeliveryAction, {
    errorNamespace: "admin.delivery",
    successMessage: tro("done"),
    onSuccess: close,
    onError: rollback,
  });

  function ids() {
    const fd = new FormData();
    fd.set("storeId", storeId);
    fd.append("deliveryIds", delivery.id);
    return fd;
  }

  function move(action: typeof dispatchDeliveriesAction, to: DeliveryState) {
    run(() => action({}, ids()), {
      optimistic: () => setOptimistic(delivery.id, { state: to }),
      rollback,
    });
  }

  function redeliver() {
    const fd = new FormData();
    fd.set("storeId", storeId);
    fd.set("deliveryId", delivery.id);
    run(() => redeliverAction({}, fd), { onSuccess: () => toast.success(tro("redelivered")) });
  }

  const items: { key: string; label: string; icon: React.ReactNode; onSelect: () => void; destructive?: boolean }[] = [];
  if (state === "assigned") {
    items.push({ key: "dispatch", label: tro("dispatch"), icon: <Truck data-icon="inline-start" />, onSelect: () => move(dispatchDeliveriesAction, "out_for_delivery") });
    items.push({ key: "unassign", label: tro("unassign"), icon: <Undo2 data-icon="inline-start" />, onSelect: () => move(unassignDeliveriesAction, "pending") });
  }
  if (state === "out_for_delivery") {
    items.push({ key: "code", label: tro("deliveredCode"), icon: <ShieldCheck data-icon="inline-start" />, onSelect: () => setDialog("code") });
    items.push({ key: "noCode", label: tro("deliveredNoCode"), icon: <CheckCircle2 data-icon="inline-start" />, onSelect: () => setDialog("noCode") });
    items.push({ key: "failed", label: tro("failed"), icon: <XCircle data-icon="inline-start" />, onSelect: () => setDialog("failed"), destructive: true });
  }
  if (state === "failed" || state === "returned") {
    items.push({ key: "redeliver", label: tro("redeliver"), icon: <RotateCcw data-icon="inline-start" />, onSelect: redeliver });
  }
  if (state === "failed") {
    items.push({ key: "returned", label: tro("returned"), icon: <PackageX data-icon="inline-start" />, onSelect: () => submitState("returned") });
  }
  if (state === "delivered" && !verified) {
    items.push({ key: "checked", label: tro("markChecked"), icon: <ShieldCheck data-icon="inline-start" />, onSelect: () => setDialog("checked") });
  }

  function submitState(to: DeliveryState) {
    const fd = new FormData();
    fd.set("storeId", storeId);
    fd.set("deliveryId", delivery.id);
    fd.set("state", to);
    run(() => setDeliveryStateAction({}, fd), { optimistic: () => setOptimistic(delivery.id, { state: to }), rollback });
  }

  const runHref = delivery.courierId ? `/admin/delivery/runs/${delivery.courierId}${delivery.scheduledFor ? `?d=${delivery.scheduledFor}` : ""}` : null;
  const busy = pending || codePending || statePending || checkedPending;
  if (items.length === 0 && !runHref) return null;

  const hidden = (
    <>
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="deliveryId" value={delivery.id} />
    </>
  );

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            variant === "menu" ? (
              <Button variant="ghost" size="icon-sm" aria-label={tc("actions")} disabled={busy} />
            ) : (
              <Button variant="outline" size="sm" disabled={busy} />
            )
          }
        >
          {variant === "menu" ? (
            <MoreHorizontal />
          ) : (
            <>
              {tc("actions")}
              <ChevronDown data-icon="inline-end" />
            </>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          {items.map((item, i) => (
            <span key={item.key} className="contents">
              {item.destructive && i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem variant={item.destructive ? "destructive" : "default"} onClick={item.onSelect}>
                {item.icon}
                {item.label}
              </DropdownMenuItem>
            </span>
          ))}
          {runHref && (
            <>
              {items.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem render={<Link href={runHref} />}>
                <Route data-icon="inline-start" />
                {tro("runSheet")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delivered with the customer's code */}
      <Dialog open={dialog === "code"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <form action={codeAction} onSubmit={() => setOptimistic(delivery.id, { state: "delivered", verified: true })} className="flex flex-col gap-4">
            <input type="hidden" name="storeId" value={storeId} />
            <input type="hidden" name="orderId" value={delivery.orderId} />
            <DialogHeader>
              <DialogTitle>{tro("deliveredCode")}</DialogTitle>
              <DialogDescription>{t("run.instruction")}</DialogDescription>
            </DialogHeader>
            <FormField name="code" label={t("run.codeBox")} errors={codeState.fieldErrors} required>
              <LatinInput kind="code" id="code" name="code" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="off" placeholder="000000" className="text-center text-lg tracking-[0.4em] tabular-nums" />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={close}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={codePending}>
                {tro("deliveredCode")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delivered without a code: who took it and why there was no code */}
      <Dialog open={dialog === "noCode"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <form action={stateFormAction} onSubmit={() => setOptimistic(delivery.id, { state: "delivered", verified: false })} className="flex flex-col gap-4">
            {hidden}
            <input type="hidden" name="state" value="delivered" />
            <DialogHeader>
              <DialogTitle>{tro("noCodeTitle")}</DialogTitle>
              <DialogDescription>{tro("noCodeHint")}</DialogDescription>
            </DialogHeader>
            <FormField name="recipientName" label={tro("recipient")} errors={stateFormState.fieldErrors}>
              <Input id="recipientName" name="recipientName" maxLength={120} />
            </FormField>
            <FormField name="note" label={tro("reason")} errors={stateFormState.fieldErrors} required>
              <Textarea id="note" name="note" rows={2} required maxLength={300} />
            </FormField>
            {delivery.cashExpected > 0 && (
              <FormField name="cashCollected" label={tro("cash")} errors={stateFormState.fieldErrors}>
                <MoneyInput id="cashCollected" name="cashCollected" currency={delivery.currency} defaultValue={delivery.cashExpected} />
              </FormField>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={close}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={statePending}>
                {tro("deliveredNoCode")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Failed at the door */}
      <Dialog open={dialog === "failed"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <form action={stateFormAction} onSubmit={() => setOptimistic(delivery.id, { state: "failed" })} className="flex flex-col gap-4">
            {hidden}
            <input type="hidden" name="state" value="failed" />
            <DialogHeader>
              <DialogTitle>{tro("failedTitle")}</DialogTitle>
              <DialogDescription>{tro("failedHint")}</DialogDescription>
            </DialogHeader>
            <RadioGroup name="failureReason" defaultValue={FAILURE_REASONS[0]} aria-label={tro("failedTitle")}>
              {FAILURE_REASONS.map((r) => (
                <Label key={r} className="flex items-center gap-2 text-sm font-normal">
                  <RadioGroupItem value={r} />
                  {t(`failureReason.${r}`)}
                </Label>
              ))}
            </RadioGroup>
            <FormField name="note" label={tro("note")} errors={stateFormState.fieldErrors}>
              <Textarea id="note" name="note" rows={2} maxLength={300} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={close}>
                {tc("cancel")}
              </Button>
              <Button type="submit" variant="destructive" disabled={statePending}>
                {tro("failed")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mark a no-code close as checked */}
      <Dialog open={dialog === "checked"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <form action={checkedAction} onSubmit={() => setOptimistic(delivery.id, { verified: true })} className="flex flex-col gap-4">
            {hidden}
            <DialogHeader>
              <DialogTitle>{tro("checkedTitle")}</DialogTitle>
              <DialogDescription>{tro("checkedHint")}</DialogDescription>
            </DialogHeader>
            <FormField name="note" label={tro("note")} errors={checkedState.fieldErrors}>
              <Textarea id="note" name="note" rows={2} maxLength={300} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={close}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={checkedPending}>
                {tro("markChecked")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
