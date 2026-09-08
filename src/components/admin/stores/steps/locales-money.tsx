"use client";

import { useTranslations } from "next-intl";
import { FormField } from "@/components/admin/shared/form-field";
import { NumberInput } from "@/components/admin/shared/number-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { localeNames, locales, type Locale } from "@/i18n/config";
import { CURRENCY_OPTIONS } from "@/lib/admin/stores/defaults";
import type { Currency } from "@/lib/admin/stores/schema";
import { cn } from "@/lib/utils";
import type { StepProps } from "./types";

const localeItems = locales.map((l) => ({ value: l, label: localeNames[l] }));

export function LocalesMoneyStep({ draft, update, errors }: StepProps) {
  const t = useTranslations("stores.localesMoney");
  const enabled = draft.enabledLocales as Locale[];

  function toggleLocale(locale: Locale, on: boolean) {
    const next = on ? Array.from(new Set([...enabled, locale])) : enabled.filter((l) => l !== locale);
    update({ enabledLocales: locales.filter((l) => next.includes(l)) });
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <FormField name="defaultLocale" label={t("defaultLocale")} errors={errors} required>
        <Select
          items={localeItems}
          value={draft.defaultLocale}
          onValueChange={(v) => {
            if (!v) return;
            const loc = v as Locale;
            update({ defaultLocale: loc, enabledLocales: locales.filter((l) => l === loc || enabled.includes(l)) });
          }}
        >
          <SelectTrigger id="defaultLocale" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {localeItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField name="enabledLocales" label={t("enabledLocales")} errors={errors} description={t("enabledLocalesHint")}>
        <div className="flex flex-col gap-2 rounded-lg border p-2.5" role="group" id="enabledLocales">
          {locales.map((l) => {
            const isDefault = l === draft.defaultLocale;
            const checked = enabled.includes(l);
            return (
              <Label key={l} className={cn("flex cursor-pointer items-center gap-2.5 py-0.5 font-normal", isDefault && "cursor-default")}>
                <Checkbox checked={checked} disabled={isDefault} onCheckedChange={(on) => toggleLocale(l, on)} />
                <span>{localeNames[l]}</span>
                <span className="ms-auto font-mono text-xs text-muted-foreground uppercase">{l}</span>
              </Label>
            );
          })}
        </div>
      </FormField>

      <FormField name="currency" label={t("currency")} errors={errors} required>
        <Select items={CURRENCY_OPTIONS} value={draft.currency} onValueChange={(v) => v && update({ currency: v as Currency })}>
          <SelectTrigger id="currency" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCY_OPTIONS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField name="taxRateBp" label={t("taxRate")} errors={errors} description={t("taxRateHint")}>
        <NumberInput
          id="taxRateBp"
          value={Math.round(draft.taxRateBp) / 100}
          min={0}
          max={100}
          step={0.5}
          format={{ maximumFractionDigits: 2 }}
          onValueChange={(v) => update({ taxRateBp: Math.round((v ?? 0) * 100) })}
        />
      </FormField>

      <FormField name="lowStockThreshold" label={t("lowStock")} errors={errors} description={t("lowStockHint")}>
        <NumberInput id="lowStockThreshold" value={draft.lowStockThreshold} min={0} max={1000} step={1} onValueChange={(v) => update({ lowStockThreshold: Math.max(0, Math.round(v ?? 0)) })} />
      </FormField>

      <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="pricesIncludeTax">{t("pricesIncludeTax")}</Label>
          <p className="text-sm text-muted-foreground">{t("pricesIncludeTaxHint")}</p>
        </div>
        <Switch id="pricesIncludeTax" checked={draft.pricesIncludeTax} onCheckedChange={(on) => update({ pricesIncludeTax: on })} />
      </div>
    </div>
  );
}
