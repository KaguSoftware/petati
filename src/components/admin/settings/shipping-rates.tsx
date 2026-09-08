"use client";

import { Pencil, Plus, Trash2, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { localeNames, type Locale } from "@/i18n/config";
import { deleteShippingRateAction, saveShippingRateAction } from "@/lib/admin/settings/actions";
import type { ShippingRateRow } from "@/lib/db/types";
import { t as pick } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { countryFlag } from "@/lib/phone/countries";
import { ConfirmDialog } from "../shared/confirm-dialog";
import { DataTable, type Column } from "../shared/data-table";
import { EmptyState } from "../shared/empty-state";
import { FormField } from "../shared/form-field";
import { MoneyInput } from "../shared/money-input";
import { NumberInput } from "../shared/number-input";
import { StatusBadge } from "../shared/status-badge";
import { useActionToast } from "../shared/use-action-toast";
import { CountryChips } from "./country-chips";
import { translateFieldErrors } from "./field-errors";

interface Props {
  storeId: string;
  currency: string;
  locale: Locale;
  enabledLocales: Locale[];
  rates: ShippingRateRow[];
}

type Editing = { kind: "new" } | { kind: "edit"; rate: ShippingRateRow } | null;

export function ShippingRates({ storeId, currency, locale, enabledLocales, rates }: Props) {
  const t = useTranslations("admin.settings.shipping");
  const tc = useTranslations("admin.common");
  const [editing, setEditing] = useState<Editing>(null);

  const columns: Column<ShippingRateRow>[] = [
    { key: "name", header: t("name"), cell: (r) => <span className="font-medium">{pick(r.name, locale)}</span> },
    { key: "rate", header: t("rate"), className: "text-end tabular-nums", cell: (r) => formatMoney(r.rate, currency, locale) },
    { key: "free_over", header: t("freeOver"), className: "text-end tabular-nums", hideBelow: "md", cell: (r) => (r.free_over == null ? "—" : formatMoney(r.free_over, currency, locale)) },
    {
      key: "countries",
      header: t("countries"),
      hideBelow: "lg",
      cell: (r) =>
        r.countries?.length ? (
          <span className="inline-flex flex-wrap gap-1" title={r.countries.join(", ")}>
            {r.countries.slice(0, 6).map((c) => (
              <span key={c} aria-label={c}>
                {countryFlag(c)}
              </span>
            ))}
            {r.countries.length > 6 && <span className="text-xs text-muted-foreground">+{r.countries.length - 6}</span>}
          </span>
        ) : (
          <span className="text-muted-foreground">{t("allCountries")}</span>
        ),
    },
    { key: "days", header: t("days"), hideBelow: "md", className: "tabular-nums", cell: (r) => (r.min_days == null && r.max_days == null ? "—" : `${r.min_days ?? "?"}–${r.max_days ?? "?"}`) },
    { key: "status", header: tc("status"), cell: (r) => <StatusBadge kind="store" value={r.is_active ? "active" : "inactive"} /> },
    {
      key: "actions",
      header: <span className="sr-only">{tc("actions")}</span>,
      className: "w-0 text-end",
      cell: (r) => (
        <span className="inline-flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon-sm" aria-label={tc("edit")} onClick={() => setEditing({ kind: "edit", rate: r })}>
            <Pencil />
          </Button>
          <ConfirmDialog
            trigger={
              <Button type="button" variant="ghost" size="icon-sm" aria-label={tc("delete")} className="text-destructive hover:text-destructive">
                <Trash2 />
              </Button>
            }
            title={t("deleteTitle")}
            description={t("deleteDescription", { name: pick(r.name, locale) })}
            confirmLabel={tc("delete")}
            destructive
            action={() => {
              const fd = new FormData();
              fd.set("storeId", storeId);
              fd.set("rateId", r.id);
              return deleteShippingRateAction({}, fd);
            }}
          />
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t("hint")}</p>
        <Button type="button" size="sm" onClick={() => setEditing({ kind: "new" })}>
          <Plus data-icon="inline-start" />
          {t("add")}
        </Button>
      </div>
      <DataTable
        columns={columns}
        rows={rates}
        rowKey={(r) => r.id}
        empty={
          <EmptyState
            icon={Truck}
            title={t("emptyTitle")}
            description={t("emptyHint")}
            action={
              <Button type="button" size="sm" onClick={() => setEditing({ kind: "new" })}>
                <Plus data-icon="inline-start" />
                {t("add")}
              </Button>
            }
          />
        }
      />
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          {editing && (
            <RateForm
              key={editing.kind === "edit" ? editing.rate.id : "new"}
              storeId={storeId}
              currency={currency}
              enabledLocales={enabledLocales}
              rate={editing.kind === "edit" ? editing.rate : null}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RateForm({ storeId, currency, enabledLocales, rate, onDone }: { storeId: string; currency: string; enabledLocales: Locale[]; rate: ShippingRateRow | null; onDone: () => void }) {
  const t = useTranslations("admin.settings.shipping");
  const tc = useTranslations("admin.common");
  const ts = useTranslations("admin.settings");
  const [state, action, pending] = useActionToast(saveShippingRateAction, { errorNamespace: "admin.settings", onSuccess: onDone });
  const [countries, setCountries] = useState<string[]>(rate?.countries ?? []);
  const errors = translateFieldErrors(state.fieldErrors, ts);
  const nameLocales = enabledLocales.length ? enabledLocales : (["en"] as Locale[]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="rateId" value={rate?.id ?? ""} />
      <DialogHeader>
        <DialogTitle>{rate ? t("editTitle") : t("newTitle")}</DialogTitle>
        <DialogDescription>{t("formHint")}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        {nameLocales.map((l, i) => (
          <FormField key={l} name={`name_${l}`} label={`${t("name")} · ${localeNames[l]}`} errors={errors} required={i === 0}>
            <Input id={`name_${l}`} name={`name_${l}`} dir={l === "fa" ? "rtl" : "ltr"} defaultValue={rate?.name?.[l] ?? ""} maxLength={120} required={i === 0} />
          </FormField>
        ))}
        <FormField name="rate" label={t("rate")} errors={errors} required>
          <MoneyInput id="rate" name="rate" currency={currency} defaultValue={rate?.rate ?? 0} required />
        </FormField>
        <FormField name="free_over" label={t("freeOver")} description={t("freeOverHint")} errors={errors}>
          <MoneyInput id="free_over" name="free_over" currency={currency} defaultValue={rate?.free_over ?? null} placeholder="—" />
        </FormField>
        <FormField name="countries" label={t("countries")} description={t("countriesHint")} errors={errors} className="sm:col-span-2">
          <CountryChips id="countries" name="countries" value={countries} onChange={setCountries} placeholder={t("countriesPlaceholder")} />
        </FormField>
        <FormField name="min_days" label={t("minDays")} errors={errors}>
          <NumberInput id="min_days" name="min_days" defaultValue={rate?.min_days ?? null} min={0} max={365} step={1} />
        </FormField>
        <FormField name="max_days" label={t("maxDays")} errors={errors}>
          <NumberInput id="max_days" name="max_days" defaultValue={rate?.max_days ?? null} min={0} max={365} step={1} />
        </FormField>
        <FormField name="sort_order" label={t("sortOrder")} errors={errors}>
          <NumberInput id="sort_order" name="sort_order" defaultValue={rate?.sort_order ?? 0} min={0} max={10000} step={1} />
        </FormField>
        <div className="flex items-center justify-between gap-3 self-end rounded-lg border px-3 py-2">
          <Label htmlFor="is_active">{tc("active")}</Label>
          <Switch id="is_active" name="is_active" defaultChecked={rate?.is_active ?? true} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          {tc("cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? tc("saving") : tc("save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
