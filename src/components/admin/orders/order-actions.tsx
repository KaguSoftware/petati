"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { startTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LatinInput } from "@/components/forms/latin-input";
import { markPaidAction, refundOrderAction, shipOrderAction, updateOrderStatusAction } from "@/lib/admin/orders/actions";
import { TRANSITIONS, REFUNDABLE } from "@/lib/admin/orders/transitions";
import type { OrderStatus } from "@/lib/db/types";
import { formatMoney } from "@/lib/money";
import { FormField } from "../shared/form-field";
import { MoneyInput } from "../shared/money-input";
import { useActionToast } from "../shared/use-action-toast";

interface Props {
  storeId: string;
  orderId: string;
  status: OrderStatus;
  currency: string;
  locale: string;
  remainingRefundable: number;
  canRefund: boolean;
}

type DialogKind = "paid" | "ship" | "refund" | "cancel" | null;

export function OrderActions({ storeId, orderId, status, currency, locale, remainingRefundable, canRefund }: Props) {
  const t = useTranslations("admin.orders");
  const tc = useTranslations("admin.common");
  const [dialog, setDialog] = useState<DialogKind>(null);
  const close = () => setDialog(null);
  const [paidState, paidAction, paidPending] = useActionToast(markPaidAction, { errorNamespace: "admin.orders", onSuccess: close });
  const [shipState, shipAction, shipPending] = useActionToast(shipOrderAction, { errorNamespace: "admin.orders", onSuccess: close });
  const [refundState, refundAction, refundPending] = useActionToast(refundOrderAction, { errorNamespace: "admin.orders", onSuccess: close });
  const [, statusAction, statusPending] = useActionToast(updateOrderStatusAction, { errorNamespace: "admin.orders", onSuccess: close });

  const next = TRANSITIONS[status];
  const items: { key: string; label: string; onSelect: () => void; destructive?: boolean }[] = [];
  if (next.includes("paid")) items.push({ key: "paid", label: t("actions.markPaid"), onSelect: () => setDialog("paid") });
  if (next.includes("processing")) items.push({ key: "processing", label: t("actions.startProcessing"), onSelect: () => submitStatus("processing") });
  if (next.includes("shipped")) items.push({ key: "ship", label: t("actions.ship"), onSelect: () => setDialog("ship") });
  if (next.includes("delivered")) items.push({ key: "delivered", label: t("actions.markDelivered"), onSelect: () => submitStatus("delivered") });
  if (canRefund && REFUNDABLE.includes(status) && remainingRefundable > 0) items.push({ key: "refund", label: t("actions.refund"), onSelect: () => setDialog("refund") });
  if (next.includes("cancelled")) items.push({ key: "cancel", label: t("actions.cancel"), onSelect: () => setDialog("cancel"), destructive: true });

  function submitStatus(to: OrderStatus) {
    const fd = new FormData();
    fd.set("storeId", storeId);
    fd.set("orderId", orderId);
    fd.set("status", to);
    startTransition(() => statusAction(fd));
  }

  if (items.length === 0) return null;
  const hidden = (
    <>
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="orderId" value={orderId} />
    </>
  );

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger render={<Button disabled={statusPending} />}>
          {tc("actions")}
          <ChevronDown data-icon="inline-end" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          {items.map((item, i) => (
            <span key={item.key} className="contents">
              {item.destructive && i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem variant={item.destructive ? "destructive" : "default"} onClick={item.onSelect}>
                {item.label}
              </DropdownMenuItem>
            </span>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mark paid */}
      <Dialog open={dialog === "paid"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <form action={paidAction} className="flex flex-col gap-4">
            {hidden}
            <DialogHeader>
              <DialogTitle>{t("actions.markPaid")}</DialogTitle>
              <DialogDescription>{t("markPaid.description")}</DialogDescription>
            </DialogHeader>
            <FormField name="reference" label={t("markPaid.reference")} errors={paidState.fieldErrors}>
              <LatinInput kind="code" id="reference" name="reference" placeholder={t("markPaid.referencePlaceholder")} className="normal-case tracking-normal" />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={close}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={paidPending}>
                {t("actions.markPaid")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ship */}
      <Dialog open={dialog === "ship"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <form action={shipAction} className="flex flex-col gap-4">
            {hidden}
            <DialogHeader>
              <DialogTitle>{t("ship.title")}</DialogTitle>
              <DialogDescription>{t("ship.description")}</DialogDescription>
            </DialogHeader>
            <FormField name="tracking_number" label={t("ship.trackingNumber")} errors={shipState.fieldErrors}>
              <LatinInput kind="code" id="tracking_number" name="tracking_number" className="normal-case tracking-normal" />
            </FormField>
            <FormField name="tracking_url" label={t("ship.trackingUrl")} errors={shipState.fieldErrors}>
              <Input id="tracking_url" name="tracking_url" type="url" dir="ltr" placeholder="https://" />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={close}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={shipPending}>
                {t("actions.ship")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Refund */}
      <Dialog open={dialog === "refund"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <form action={refundAction} className="flex flex-col gap-4">
            {hidden}
            <DialogHeader>
              <DialogTitle>{t("refund.title")}</DialogTitle>
              <DialogDescription>{t("refund.max", { amount: formatMoney(remainingRefundable, currency, locale) })}</DialogDescription>
            </DialogHeader>
            <FormField name="amount" label={t("refund.amount")} errors={refundState.fieldErrors} required>
              <MoneyInput id="amount" name="amount" currency={currency} defaultValue={remainingRefundable} required />
            </FormField>
            <FormField name="reason" label={t("refund.reason")} errors={refundState.fieldErrors}>
              <Textarea id="reason" name="reason" rows={2} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={close}>
                {tc("cancel")}
              </Button>
              <Button type="submit" variant="destructive" disabled={refundPending}>
                {t("actions.refund")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel */}
      <Dialog open={dialog === "cancel"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cancel.title")}</DialogTitle>
            <DialogDescription>{t("cancel.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close}>
              {tc("back")}
            </Button>
            <Button type="button" variant="destructive" disabled={statusPending} onClick={() => submitStatus("cancelled")}>
              {t("actions.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
