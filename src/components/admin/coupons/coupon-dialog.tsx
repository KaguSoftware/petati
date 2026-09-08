"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LatinInput } from "@/components/forms/latin-input";
import { saveCouponAction } from "@/lib/admin/coupons/actions";
import { DISCOUNT_TYPES } from "@/lib/admin/coupons/types";
import type { CouponRow, DiscountType } from "@/lib/db/types";
import { DatePicker } from "../shared/date-picker";
import { FormField } from "../shared/form-field";
import { MoneyInput } from "../shared/money-input";
import { NumberInput } from "../shared/number-input";
import { useActionToast } from "../shared/use-action-toast";

interface DialogProps {
  storeId: string;
  currency: string;
  /** Existing coupon → edit; null → create. */
  coupon: CouponRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Date part of a timestamp for the DatePicker (which only accepts YYYY-MM-DD). */
const datePart = (ts: string | null | undefined) => (ts ? ts.slice(0, 10) : null);

/** Create + edit share this form. The value control swaps with the discount type (percent → NumberInput, fixed → MoneyInput). */
export function CouponDialog({ storeId, currency, coupon, open, onOpenChange }: DialogProps) {
  const t = useTranslations("admin.coupons");
  const tt = useTranslations("admin.discountType");
  const tc = useTranslations("admin.common");
  const [type, setType] = useState<DiscountType>(coupon?.type ?? "percent");
  // The shared DatePicker has no clear control; remounting it with a null default clears the value.
  const [dateKeys, setDateKeys] = useState({ starts_at: 0, ends_at: 0 });
  const [state, action, pending] = useActionToast(saveCouponAction, { errorNamespace: "admin.coupons", onSuccess: () => onOpenChange(false) });
  const typeItems = DISCOUNT_TYPES.map((v) => ({ value: v, label: tt(v) }));

  function clearDate(key: "starts_at" | "ends_at") {
    setDateKeys((k) => ({ ...k, [key]: k[key] + 1 }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="storeId" value={storeId} />
          <input type="hidden" name="couponId" value={coupon?.id ?? ""} />
          <input type="hidden" name="type" value={type} />
          <DialogHeader>
            <DialogTitle>{coupon ? t("edit") : t("new")}</DialogTitle>
            <DialogDescription>{t("form.codeHint")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField name="code" label={t("form.code")} errors={state.fieldErrors} required>
              <LatinInput kind="code" id="code" name="code" defaultValue={coupon?.code ?? ""} required minLength={3} maxLength={30} pattern="[A-Za-z0-9_\-]{3,30}" placeholder="SUMMER10" className="font-mono" />
            </FormField>
            <FormField name="type" label={t("form.type")} errors={state.fieldErrors} required>
              <Select items={typeItems} value={type} modal={false} onValueChange={(v) => v && setType(v as DiscountType)}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {typeItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {type === "percent" && (
              <FormField name="value" label={t("form.percent")} errors={state.fieldErrors} required>
                <NumberInput id="value" name="value" min={1} max={100} step={1} required defaultValue={coupon?.type === "percent" ? coupon.value : 10} />
              </FormField>
            )}
            {type === "fixed" && (
              <FormField name="value" label={t("form.amount")} errors={state.fieldErrors} required>
                <MoneyInput id="value" name="value" currency={currency} required defaultValue={coupon?.type === "fixed" ? coupon.value : null} />
              </FormField>
            )}
            {type === "free_shipping" && (
              <Field>
                <FieldLabel>{tt("free_shipping")}</FieldLabel>
                <FieldDescription>{t("form.freeShipping")}</FieldDescription>
              </Field>
            )}

            <FormField name="min_subtotal" label={t("form.minSubtotal")} description={t("form.minSubtotalHint")} errors={state.fieldErrors}>
              <MoneyInput id="min_subtotal" name="min_subtotal" currency={currency} defaultValue={coupon?.min_subtotal ?? null} placeholder="" />
            </FormField>
            <FormField name="max_uses" label={t("form.maxUses")} description={t("form.maxUsesHint")} errors={state.fieldErrors}>
              <NumberInput id="max_uses" name="max_uses" min={1} step={1} defaultValue={coupon?.max_uses ?? null} />
            </FormField>
            <FormField name="max_uses_per_customer" label={t("form.maxUsesPerCustomer")} errors={state.fieldErrors}>
              <NumberInput id="max_uses_per_customer" name="max_uses_per_customer" min={1} step={1} defaultValue={coupon ? coupon.max_uses_per_customer : 1} />
            </FormField>

            <FormField name="starts_at" label={t("form.startsAt")} errors={state.fieldErrors}>
              <div className="flex items-center gap-1">
                <DatePicker key={dateKeys.starts_at} id="starts_at" name="starts_at" defaultValue={dateKeys.starts_at === 0 ? datePart(coupon?.starts_at) : null} placeholder={t("always")} />
                <Button type="button" variant="ghost" size="icon-sm" aria-label={tc("remove")} onClick={() => clearDate("starts_at")}>
                  <X />
                </Button>
              </div>
            </FormField>
            <FormField name="ends_at" label={t("form.endsAt")} errors={state.fieldErrors}>
              <div className="flex items-center gap-1">
                <DatePicker key={dateKeys.ends_at} id="ends_at" name="ends_at" defaultValue={dateKeys.ends_at === 0 ? datePart(coupon?.ends_at) : null} placeholder={t("always")} />
                <Button type="button" variant="ghost" size="icon-sm" aria-label={tc("remove")} onClick={() => clearDate("ends_at")}>
                  <X />
                </Button>
              </div>
            </FormField>
          </div>

          <Field orientation="horizontal" className="rounded-lg border p-3">
            <FieldContent>
              <FieldLabel htmlFor="is_active">{t("form.isActive")}</FieldLabel>
              <FieldDescription>{t("form.isActiveHint")}</FieldDescription>
            </FieldContent>
            <Switch id="is_active" name="is_active" defaultChecked={coupon?.is_active ?? true} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? tc("saving") : coupon ? tc("save") : tc("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** "New coupon" button + dialog (toolbar). The dialog remounts per open so the form starts clean. */
export function NewCouponButton({ storeId, currency }: { storeId: string; currency: string }) {
  const t = useTranslations("admin.coupons");
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  return (
    <>
      <Button
        size="sm"
        onClick={() => {
          setSession((s) => s + 1);
          setOpen(true);
        }}
      >
        <Plus data-icon="inline-start" />
        {t("new")}
      </Button>
      <CouponDialog key={session} storeId={storeId} currency={currency} coupon={null} open={open} onOpenChange={setOpen} />
    </>
  );
}
