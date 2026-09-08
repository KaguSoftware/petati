"use client";

import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { adjustStockAction } from "@/lib/admin/inventory/actions";
import { ADJUST_REASONS, type AdjustReason } from "@/lib/admin/inventory/types";
import { FormField } from "../shared/form-field";
import { NumberInput } from "../shared/number-input";
import { useActionToast } from "../shared/use-action-toast";

interface Props {
  storeId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  sku: string | null;
  currentQty: number;
  locale: string;
  /** Icon-only trigger for dense tables. */
  compact?: boolean;
}

export function AdjustStockDialog({ storeId, variantId, productName, variantLabel, sku, currentQty, locale, compact }: Props) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          compact ? (
            <Button type="button" variant="ghost" size="icon-sm" aria-label={t("inventory.adjust")} />
          ) : (
            <Button type="button" variant="outline" size="sm" />
          )
        }
      >
        <SlidersHorizontal />
        {!compact && t("inventory.adjust")}
      </DialogTrigger>
      <DialogContent>
        {open && (
          <AdjustForm storeId={storeId} variantId={variantId} productName={productName} variantLabel={variantLabel} sku={sku} currentQty={currentQty} locale={locale} onDone={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AdjustForm({ storeId, variantId, productName, variantLabel, sku, currentQty, locale, onDone }: Omit<Props, "compact"> & { onDone: () => void }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionToast(adjustStockAction, { errorNamespace: "admin.inventory", onSuccess: onDone });
  const [mode, setMode] = useState<"delta" | "set">("delta");
  const [quantity, setQuantity] = useState<number | null>(mode === "set" ? currentQty : 0);
  const [reason, setReason] = useState<AdjustReason>("adjustment");
  const num = new Intl.NumberFormat(locale);
  const reasonItems = useMemo(() => ADJUST_REASONS.map((r) => ({ value: r, label: t(`stockReason.${r}`) })), [t]);
  const errors = useMemo(() => {
    if (!state.fieldErrors) return undefined;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(state.fieldErrors)) out[k] = v === "zeroDelta" ? t("inventory.fieldErrors.zeroDelta") : v;
    return out;
  }, [state.fieldErrors, t]);
  const resulting = quantity == null ? currentQty : mode === "delta" ? currentQty + quantity : quantity;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="variantId" value={variantId} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="reason" value={reason} />
      <DialogHeader>
        <DialogTitle>{t("inventory.adjustTitle")}</DialogTitle>
        <DialogDescription>
          <span className="font-medium text-foreground">{productName}</span>
          {variantLabel && <span> · {variantLabel}</span>}
          {sku && (
            <span className="mx-2 text-xs" dir="ltr">
              {sku}
            </span>
          )}
        </DialogDescription>
      </DialogHeader>

      <RadioGroup
        value={mode}
        onValueChange={(v) => {
          const next = v as "delta" | "set";
          setMode(next);
          setQuantity(next === "set" ? currentQty : 0);
        }}
        className="grid-cols-2"
      >
        {(["delta", "set"] as const).map((m) => (
          <Label key={m} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal has-data-checked:border-primary">
            <RadioGroupItem value={m} className="mt-0.5" />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">{t(`inventory.mode.${m}`)}</span>
              <span className="text-xs text-muted-foreground">{t(`inventory.mode.${m}Hint`)}</span>
            </span>
          </Label>
        ))}
      </RadioGroup>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="quantity" label={mode === "delta" ? t("inventory.delta") : t("inventory.newQuantity")} errors={errors} required>
          <NumberInput id="quantity" name="quantity" value={quantity} onValueChange={setQuantity} min={mode === "set" ? 0 : -1_000_000} max={1_000_000} required />
        </FormField>
        <FormField name="reason" label={t("inventory.reason")} errors={errors} required>
          <Select items={reasonItems} value={reason} onValueChange={(v) => v && setReason(v as AdjustReason)} modal={false}>
            <SelectTrigger id="reason" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {reasonItems.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("inventory.preview", { from: num.format(currentQty), to: num.format(resulting) })}
      </p>
      <FormField name="note" label={t("inventory.note")} errors={errors}>
        <Textarea id="note" name="note" rows={2} placeholder={t("inventory.notePlaceholder")} />
      </FormField>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={pending || quantity == null || (mode === "delta" ? quantity === 0 : quantity === currentQty)}>
          {pending ? t("common.saving") : t("inventory.apply")}
        </Button>
      </DialogFooter>
    </form>
  );
}
