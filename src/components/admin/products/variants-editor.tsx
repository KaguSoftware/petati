"use client";

import { Plus, Sparkles, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LatinInput } from "@/components/forms/latin-input";
import { Link } from "@/i18n/navigation";
import { localeNames, type Locale } from "@/i18n/config";
import { deleteVariantAction, generateVariantsAction, saveOptionsAction, saveVariantAction } from "@/lib/admin/products/actions";
import type { OptionWithValues, VariantWithValues } from "@/lib/admin/products/types";
import { pickJson } from "@/lib/catalog/types";
import type { Translated } from "@/lib/db/types";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "../shared/confirm-dialog";
import { FormField } from "../shared/form-field";
import { MoneyInput } from "../shared/money-input";
import { NumberInput } from "../shared/number-input";
import { StatusBadge } from "../shared/status-badge";
import { useActionToast } from "../shared/use-action-toast";
import { useProductFieldErrors } from "./product-form";
import { numberFormat } from "@/lib/number";

interface Props {
  storeId: string;
  productId: string;
  currency: string;
  locale: Locale;
  defaultLocale: Locale;
  enabledLocales: Locale[];
  lowStockThreshold: number;
  options: OptionWithValues[];
  variants: VariantWithValues[];
}

interface DraftValue {
  key: string;
  id?: string;
  value: Translated;
  swatch: string;
}
interface DraftOption {
  key: string;
  id?: string;
  name: Translated;
  values: DraftValue[];
}

let seq = 0;
const nextKey = () => `k${++seq}`;

function toDraft(options: OptionWithValues[]): DraftOption[] {
  return options.map((o) => ({ key: o.id, id: o.id, name: { ...o.name }, values: o.values.map((v) => ({ key: v.id, id: v.id, value: { ...v.value }, swatch: v.swatch ?? "" })) }));
}

export function VariantsEditor({ storeId, productId, currency, locale, defaultLocale, enabledLocales, lowStockThreshold, options, variants }: Props) {
  const t = useTranslations("admin");
  return (
    <div className="flex flex-col gap-6">
      <OptionsBuilder storeId={storeId} productId={productId} defaultLocale={defaultLocale} enabledLocales={enabledLocales} options={options} hasVariants={variants.length > 0} />
      <VariantsList
        storeId={storeId}
        productId={productId}
        currency={currency}
        locale={locale}
        defaultLocale={defaultLocale}
        lowStockThreshold={lowStockThreshold}
        options={options}
        variants={variants}
        title={t("products.variants")}
      />
    </div>
  );
}

// ---------------------------------------------------------------- options

function OptionsBuilder({ storeId, productId, defaultLocale, enabledLocales, options, hasVariants }: Pick<Props, "storeId" | "productId" | "defaultLocale" | "enabledLocales" | "options"> & { hasVariants: boolean }) {
  const t = useTranslations("admin.products.options");
  const tc = useTranslations("admin.common");
  const [draft, setDraft] = useState<DraftOption[]>(() => toDraft(options));
  const [dirty, setDirty] = useState(false);
  // After a save the server re-renders with real ids: resync the draft (derived state) so a second save updates instead of re-creating.
  const signature = JSON.stringify(options);
  const [seenSignature, setSeenSignature] = useState(signature);
  if (signature !== seenSignature) {
    setSeenSignature(signature);
    setDraft(toDraft(options));
    setDirty(false);
  }
  const [state, action, pending] = useActionToast(saveOptionsAction, { errorNamespace: "admin.products", onSuccess: () => setDirty(false) });
  const [genState, generate, generating] = useActionToast(generateVariantsAction, { errorNamespace: "admin.products" });
  const errors = useProductFieldErrors(state.fieldErrors);
  void genState;

  function update(fn: (prev: DraftOption[]) => DraftOption[]) {
    setDraft(fn);
    setDirty(true);
  }
  const setOptionName = (key: string, l: Locale, v: string) => update((prev) => prev.map((o) => (o.key === key ? { ...o, name: { ...o.name, [l]: v } } : o)));
  const setValue = (ok: string, vk: string, l: Locale, v: string) =>
    update((prev) => prev.map((o) => (o.key === ok ? { ...o, values: o.values.map((x) => (x.key === vk ? { ...x, value: { ...x.value, [l]: v } } : x)) } : o)));
  const setSwatch = (ok: string, vk: string, v: string) => update((prev) => prev.map((o) => (o.key === ok ? { ...o, values: o.values.map((x) => (x.key === vk ? { ...x, swatch: v } : x)) } : o)));

  const payload = draft.map((o) => ({ id: o.id, name: o.name, values: o.values.map((v, i) => ({ id: v.id, value: v.value, swatch: v.swatch || null, sort_order: i })) }));

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">{t("title")}</h2>
          <p className="text-xs text-muted-foreground">{t("hint")}</p>
        </div>
        <form action={generate}>
          <input type="hidden" name="storeId" value={storeId} />
          <input type="hidden" name="productId" value={productId} />
          <Button type="submit" size="sm" variant={hasVariants ? "outline" : "default"} disabled={generating || dirty || draft.some((o) => o.values.length === 0)} title={dirty ? t("saveFirst") : undefined}>
            <Sparkles />
            {t("generate")}
          </Button>
        </form>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="storeId" value={storeId} />
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="options" value={JSON.stringify(payload)} />
        {errors?.options && <p className="text-sm text-destructive">{errors.options}</p>}
        {draft.length === 0 && <p className="text-sm text-muted-foreground">{t("none")}</p>}
        {draft.map((o, oi) => (
          <div key={o.key} className="flex flex-col gap-3 rounded-lg border p-3">
            <div className="flex items-start gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-3">
                {enabledLocales.map((l) => (
                  <FormField key={l} name={`opt-${o.key}-${l}`} label={`${t("name")} · ${localeNames[l]}`} required={l === defaultLocale}>
                    <Input id={`opt-${o.key}-${l}`} lang={l} dir={l === "fa" ? "rtl" : "ltr"} value={o.name[l] ?? ""} onChange={(e) => setOptionName(o.key, l, e.target.value)} placeholder={l === defaultLocale ? t("namePlaceholder") : undefined} />
                  </FormField>
                ))}
              </div>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={tc("remove")} className="mt-5 text-muted-foreground" onClick={() => update((prev) => prev.filter((x) => x.key !== o.key))}>
                <Trash2 />
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">{t("values")}</span>
              {o.values.map((v) => (
                <div key={v.key} className="flex items-center gap-2">
                  <div className="grid flex-1 gap-2 sm:grid-cols-3">
                    {enabledLocales.map((l) => (
                      <Input key={l} aria-label={`${t("value")} · ${localeNames[l]}`} lang={l} dir={l === "fa" ? "rtl" : "ltr"} value={v.value[l] ?? ""} onChange={(e) => setValue(o.key, v.key, l, e.target.value)} placeholder={localeNames[l]} />
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <span aria-hidden className="size-5 shrink-0 rounded-full border" style={{ background: /^#[0-9a-f]{3,8}$/i.test(v.swatch) ? v.swatch : "transparent" }} />
                    <LatinInput kind="code" aria-label={t("swatch")} value={v.swatch} onChange={(e) => setSwatch(o.key, v.key, e.target.value)} placeholder="#hex" className="w-24 normal-case tracking-normal" />
                  </div>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={tc("remove")} className="text-muted-foreground" onClick={() => update((prev) => prev.map((x) => (x.key === o.key ? { ...x, values: x.values.filter((y) => y.key !== v.key) } : x)))}>
                    <X />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => update((prev) => prev.map((x, i) => (i === oi ? { ...x, values: [...x.values, { key: nextKey(), value: {}, swatch: "" }] } : x)))}>
                <Plus />
                {t("addValue")}
              </Button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={draft.length >= 5} onClick={() => update((prev) => [...prev, { key: nextKey(), name: {}, values: [{ key: nextKey(), value: {}, swatch: "" }] }])}>
            <Plus />
            {t("add")}
          </Button>
          <Button type="submit" size="sm" disabled={pending || !dirty} className="ms-auto">
            {pending ? tc("saving") : t("save")}
          </Button>
        </div>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------- variants

function VariantsList({
  storeId,
  productId,
  currency,
  locale,
  defaultLocale,
  lowStockThreshold,
  options,
  variants,
  title,
}: Pick<Props, "storeId" | "productId" | "currency" | "locale" | "defaultLocale" | "lowStockThreshold" | "options" | "variants"> & { title: string }) {
  const t = useTranslations("admin.products.variant");
  const [adding, setAdding] = useState(false);
  // One action state for every card: cards are keyed on their saved data and remount after a
  // save, so the toast/pending/fieldErrors must live here. `state.id` says which card it concerns.
  const [state, action, pending] = useActionToast(saveVariantAction, {
    errorNamespace: "admin.products",
    onSuccess: (s) => {
      if (s.id?.startsWith("new:")) setAdding(false);
    },
  });
  const errorsFor = (ref: string) => (state.id === ref ? state.fieldErrors : undefined);
  const valueLabel = new Map<string, string>();
  for (const o of options) for (const v of o.values) valueLabel.set(v.id, pickJson(v.value, locale, defaultLocale));
  const label = (v: VariantWithValues) => {
    const parts = v.optionValueIds.map((id) => valueLabel.get(id)).filter(Boolean);
    return parts.length ? parts.join(" · ") : t("defaultLabel");
  };
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {title} <span className="tabular-nums">({variants.length})</span>
        </h2>
        {options.length === 0 && !adding && (
          <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus />
            {t("add")}
          </Button>
        )}
      </div>
      {variants.length === 0 && !adding && <p className="text-sm text-muted-foreground">{options.length ? t("emptyGenerate") : t("empty")}</p>}
      <div className="flex flex-col gap-3">
        {adding && (
          <VariantCard
            storeId={storeId}
            productId={productId}
            currency={currency}
            locale={locale}
            lowStockThreshold={lowStockThreshold}
            variant={null}
            label={t("newVariant")}
            isFirst={variants.length === 0}
            onDone={() => setAdding(false)}
            action={action}
            pending={pending}
            fieldErrors={errorsFor("new")}
          />
        )}
        {variants.map((v) => (
          // React resets uncontrolled fields after a form action, so the card is keyed on its saved
          // data: a save remounts it with fresh defaults instead of stale ones.
          <VariantCard key={`${v.id}:${v.sku}:${v.barcode}:${v.price}:${v.compare_at_price}:${v.cost_price}:${v.weight_grams}:${v.track_inventory}:${v.allow_backorder}:${v.is_default}:${v.is_active}`} storeId={storeId} productId={productId} currency={currency} locale={locale} lowStockThreshold={lowStockThreshold} variant={v} label={label(v)} isFirst={false} action={action} pending={pending} fieldErrors={errorsFor(v.id)} />
        ))}
      </div>
    </section>
  );
}

interface CardProps {
  storeId: string;
  productId: string;
  currency: string;
  locale: string;
  lowStockThreshold: number;
  variant: VariantWithValues | null;
  label: string;
  isFirst: boolean;
  onDone?: () => void;
  action: (formData: FormData) => void;
  pending: boolean;
  fieldErrors?: Record<string, string>;
}

function VariantCard({ storeId, productId, currency, locale, lowStockThreshold, variant, label, isFirst, onDone, action, pending, fieldErrors }: CardProps) {
  const t = useTranslations("admin.products.variant");
  const tc = useTranslations("admin.common");
  const errors = useProductFieldErrors(fieldErrors);
  const initial = variant;
  const id = variant?.id ?? "new";
  const f = (name: string) => `${name}-${id}`;
  const num = numberFormat(locale);
  const level = variant ? (!variant.track_inventory ? "ok" : variant.stock_qty <= 0 ? "out" : variant.stock_qty <= lowStockThreshold ? "low" : "ok") : null;

  return (
    <form action={action} className={cn("flex flex-col gap-3 rounded-lg border p-3", variant && !variant.is_active && "opacity-70")}>
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={variant?.id ?? ""} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{label}</span>
          {variant?.is_default && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{t("default")}</span>}
          {variant && level && (
            <Link href={`/admin/inventory?q=${encodeURIComponent(variant.sku ?? "")}`} className="flex items-center gap-1.5 text-xs hover:underline">
              <StatusBadge kind="stock" value={level} />
              <span className="tabular-nums">{num.format(variant.stock_qty)}</span>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          {variant && (
            <ConfirmDialog
              trigger={
                <Button type="button" variant="ghost" size="icon-sm" aria-label={tc("delete")} className="text-muted-foreground">
                  <Trash2 />
                </Button>
              }
              title={t("delete.title")}
              description={t("delete.description")}
              confirmLabel={tc("delete")}
              destructive
              action={async () => {
                const fd = new FormData();
                fd.set("storeId", storeId);
                fd.set("variantId", variant.id);
                const res = await deleteVariantAction({}, fd);
                if (res.error === "variantHasOrders" || res.error === "variantInCarts") return { error: t(`errors.${res.error}`) };
                return res;
              }}
            />
          )}
          {onDone && (
            <Button type="button" variant="ghost" size="sm" onClick={onDone}>
              {tc("cancel")}
            </Button>
          )}
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? tc("saving") : tc("save")}
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FormField name="sku" label={t("sku")} errors={errors}>
          <LatinInput kind="code" id={f("sku")} name="sku" defaultValue={initial?.sku ?? ""} className="tracking-normal" />
        </FormField>
        <FormField name="barcode" label={t("barcode")} errors={errors}>
          <LatinInput kind="code" id={f("barcode")} name="barcode" defaultValue={initial?.barcode ?? ""} className="normal-case tracking-normal" />
        </FormField>
        <FormField name="price" label={t("price")} errors={errors} required>
          <MoneyInput id={f("price")} name="price" currency={currency} defaultValue={initial?.price ?? 0} required />
        </FormField>
        <FormField name="compare_at_price" label={t("compareAt")} errors={errors}>
          <MoneyInput id={f("compare_at_price")} name="compare_at_price" currency={currency} defaultValue={initial?.compare_at_price} />
        </FormField>
        <FormField name="cost_price" label={t("cost")} errors={errors}>
          <MoneyInput id={f("cost_price")} name="cost_price" currency={currency} defaultValue={initial?.cost_price} />
        </FormField>
        <FormField name="weight_grams" label={t("weight")} errors={errors}>
          <NumberInput id={f("weight_grams")} name="weight_grams" defaultValue={initial?.weight_grams} min={0} step={10} />
        </FormField>
        {(!variant || (variant.track_inventory && variant.stock_qty === 0)) && (
          <FormField name="initial_stock" label={t("initialStock")} errors={errors}>
            <NumberInput id={f("initial_stock")} name="initial_stock" defaultValue={0} min={0} />
          </FormField>
        )}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Label className="flex items-center gap-2 font-normal">
          <Switch size="sm" name="track_inventory" defaultChecked={initial?.track_inventory ?? true} />
          {t("trackInventory")}
        </Label>
        <Label className="flex items-center gap-2 font-normal">
          <Switch size="sm" name="allow_backorder" defaultChecked={initial?.allow_backorder ?? false} />
          {t("allowBackorder")}
        </Label>
        <Label className="flex items-center gap-2 font-normal">
          <Switch size="sm" name="is_default" defaultChecked={initial?.is_default ?? isFirst} />
          {t("isDefault")}
        </Label>
        <Label className="flex items-center gap-2 font-normal">
          <Switch size="sm" name="is_active" defaultChecked={initial?.is_active ?? true} />
          {t("isActive")}
        </Label>
      </div>
    </form>
  );
}
