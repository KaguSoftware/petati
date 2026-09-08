"use client";

import { useTranslations } from "next-intl";
import { CircleAlert, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { localeNames, type Locale } from "@/i18n/config";
import { STEP_ORDER, type CreateStoreInput, type WizardStep } from "@/lib/admin/stores/schema";
import { SECTION_KEYS } from "@/lib/theme/types";
import { ThemePreviewCard } from "../theme-preview-card";

interface Props {
  draft: CreateStoreInput;
  rootDomain: string;
  logoPreview: string | null;
  errorMessage: string | null;
  pending: boolean;
  onEdit: (step: WizardStep) => void;
  onSubmit: () => void;
}

export function ReviewStep({ draft, rootDomain, logoPreview, errorMessage, pending, onEdit, onSubmit }: Props) {
  const t = useTranslations("stores");
  const tr = useTranslations("stores.review");
  const values = SECTION_KEYS.map((k) => draft.sections[k]);
  const uniform = values.every((v) => v === values[0]);
  const dash = <span className="text-muted-foreground">{tr("notSet")}</span>;

  const rows: { step: WizardStep; items: { label: string; value: React.ReactNode }[] }[] = [
    {
      step: "basics",
      items: [
        { label: t("basics.name"), value: draft.name },
        { label: t("basics.slug"), value: <code dir="ltr">{draft.slug}</code> },
        { label: t("basics.tagline"), value: draft.tagline || dash },
      ],
    },
    {
      step: "localesMoney",
      items: [
        { label: t("localesMoney.defaultLocale"), value: localeNames[draft.defaultLocale as Locale] },
        {
          label: t("localesMoney.enabledLocales"),
          value: (
            <span className="flex flex-wrap gap-1">
              {(draft.enabledLocales as Locale[]).map((l) => (
                <Badge key={l} variant="outline">
                  {localeNames[l]}
                </Badge>
              ))}
            </span>
          ),
        },
        { label: t("localesMoney.currency"), value: draft.currency },
        { label: t("localesMoney.taxRate"), value: `${draft.taxRateBp / 100}% · ${draft.pricesIncludeTax ? tr("pricesIncludeTax") : tr("pricesExcludeTax")}` },
        { label: t("localesMoney.lowStock"), value: tr("lowStock", { n: draft.lowStockThreshold }) },
      ],
    },
    {
      step: "branding",
      items: [
        { label: t("branding.logo"), value: logoPreview ? tr("logoSet") : tr("logoNone") },
        {
          label: t("branding.colors"),
          value: (
            <span className="flex gap-1">
              {Object.values(draft.colors).map((hex, i) => (
                <span key={i} className="size-4 rounded-sm border border-foreground/10" style={{ backgroundColor: hex }} title={hex} />
              ))}
            </span>
          ),
        },
        { label: t("branding.radius"), value: <code dir="ltr">{draft.radius}</code> },
      ],
    },
    {
      step: "design",
      items: [
        { label: t("design.preset"), value: uniform ? tr("allSections", { variant: t(`design.variants.${values[0]}.name`) }) : tr("mixed") },
        {
          label: t("design.announcement"),
          value: Object.values(draft.announcement ?? {}).some((v) => v && v.trim()) ? (
            <span className="flex flex-col gap-0.5">
              {(draft.enabledLocales as Locale[]).map((l) => {
                const v = draft.announcement?.[l];
                return v ? (
                  <span key={l} className="truncate">
                    <span className="me-1 text-xs text-muted-foreground uppercase">{l}</span>
                    {v}
                  </span>
                ) : null;
              })}
            </span>
          ) : (
            dash
          ),
        },
      ],
    },
    {
      step: "contact",
      items: [
        { label: t("contact.email"), value: draft.contactEmail ? <span dir="ltr">{draft.contactEmail}</span> : dash },
        { label: t("contact.phone"), value: draft.contactPhone ? <span dir="ltr">{draft.contactPhone}</span> : dash },
        { label: t("contact.emailFrom"), value: draft.emailFrom ? <span dir="ltr">{draft.emailFrom}</span> : dash },
      ],
    },
    {
      step: "domain",
      items: [
        {
          label: t("domain.subdomain"),
          value: (
            <code dir="ltr">
              {draft.slug}.{rootDomain}
            </code>
          ),
        },
        { label: t("domain.custom"), value: draft.customDomain ? <code dir="ltr">{draft.customDomain}</code> : tr("subdomainOnly") },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">{tr("intro")}</p>
      {errorMessage && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col divide-y rounded-xl border">
          {rows.map((group) => (
            <section key={group.step} className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">{t(`steps.${group.step}`)}</h3>
                <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(group.step)}>
                  {t("wizard.edit")}
                </Button>
              </div>
              <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[12rem_minmax(0,1fr)]">
                {group.items.map((item) => (
                  <div key={item.label} className="contents">
                    <dt className="text-muted-foreground">{item.label}</dt>
                    <dd className="min-w-0 truncate">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
        <div className="flex flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
          <ThemePreviewCard colors={draft.colors} radius={draft.radius} name={draft.name} logoUrl={logoPreview} />
          <Button type="button" size="lg" onClick={onSubmit} disabled={pending} className="w-full">
            {pending && <Loader2 data-icon="inline-start" className="animate-spin" />}
            {pending ? t("wizard.submitting") : t("wizard.submit")}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{t("wizard.stepOf", { step: STEP_ORDER.length, total: STEP_ORDER.length })}</p>
        </div>
      </div>
    </div>
  );
}
