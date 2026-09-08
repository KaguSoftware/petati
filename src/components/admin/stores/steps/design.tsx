"use client";

import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { dirFor, localeNames, type Locale } from "@/i18n/config";
import { SECTION_KEYS, VARIANT_KEYS, type SectionKey, type VariantKey } from "@/lib/theme/types";
import { cn } from "@/lib/utils";
import type { StepProps } from "./types";

interface Props extends StepProps {
  locale: string;
  /** Implemented variants per section (from the theme registry). */
  variants: Record<SectionKey, VariantKey[]>;
  showPreviewLinks: boolean;
}

export function DesignStep({ draft, update, errors, locale, variants, showPreviewLinks }: Props) {
  const t = useTranslations("stores.design");
  const tc = useTranslations("stores.wizard");
  const sections = draft.sections;
  const values = SECTION_KEYS.map((k) => sections[k]);
  const preset = values.every((v) => v === values[0]) ? values[0] : "";
  const availableEverywhere = (v: VariantKey) => SECTION_KEYS.every((k) => variants[k]?.includes(v));

  function applyPreset(v: VariantKey) {
    update({ sections: Object.fromEntries(SECTION_KEYS.map((k) => [k, v])) as Record<SectionKey, VariantKey> });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <Label id="preset-label">{t("preset")}</Label>
          <p className="text-sm text-muted-foreground">{t("presetHint")}</p>
        </div>
        <RadioGroup aria-labelledby="preset-label" value={preset} onValueChange={(v) => v && applyPreset(v as VariantKey)} className="grid-cols-1 sm:grid-cols-2">
          {VARIANT_KEYS.map((v) => {
            const enabled = availableEverywhere(v);
            return (
              <Label
                key={v}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3.5 font-normal transition-colors has-data-checked:border-primary has-data-checked:bg-primary/5",
                  enabled ? "cursor-pointer hover:bg-muted/50" : "cursor-not-allowed opacity-70",
                )}
              >
                <RadioGroupItem value={v} disabled={!enabled} className="mt-0.5" />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{t(`variants.${v}.name`)}</span>
                    {!enabled && <Badge variant="secondary">{t("comingSoon")}</Badge>}
                  </span>
                  <span className="text-sm text-muted-foreground">{t(`variants.${v}.description`)}</span>
                  <VariantSwatch variant={v} />
                </span>
              </Label>
            );
          })}
        </RadioGroup>
        {showPreviewLinks && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{tc("previewLinks")}:</span>
            {VARIANT_KEYS.map((v) => (
              <a key={v} href={`/${locale}/preview/${v}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground">
                {t(`variants.${v}.name`)}
                <ExternalLink className="size-3" />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <Label>{t("sections")}</Label>
          <p className="text-sm text-muted-foreground">{t("sectionsHint")}</p>
        </div>
        <div className="grid gap-2 rounded-xl border p-2 sm:grid-cols-2">
          {SECTION_KEYS.map((key) => {
            const items = VARIANT_KEYS.map((v) => ({ value: v, label: t(`variants.${v}.name`) }));
            return (
              <div key={key} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                <Label htmlFor={`sections.${key}`} className="font-normal">
                  {t(`sectionNames.${key}`)}
                </Label>
                <Select items={items} value={sections[key]} onValueChange={(v) => v && update({ sections: { ...sections, [key]: v as VariantKey } })}>
                  <SelectTrigger id={`sections.${key}`} size="sm" className="w-32" aria-invalid={!!errors[`sections.${key}`] || undefined}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} align="end">
                    {items.map((item) => (
                      <SelectItem key={item.value} value={item.value} disabled={!variants[key]?.includes(item.value)}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <Label>{t("announcement")}</Label>
          <p className="text-sm text-muted-foreground">{t("announcementHint")}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {(draft.enabledLocales as Locale[]).map((l) => (
            <div key={l} className="flex flex-col gap-1.5">
              <Label htmlFor={`announcement.${l}`} className="text-xs text-muted-foreground">
                {localeNames[l]}
              </Label>
              <Textarea
                id={`announcement.${l}`}
                dir={dirFor(l)}
                rows={2}
                maxLength={120}
                value={draft.announcement?.[l] ?? ""}
                placeholder={t("announcementPlaceholder")}
                aria-invalid={!!errors[`announcement.${l}`] || undefined}
                onChange={(e) => update({ announcement: { ...draft.announcement, [l]: e.target.value } })}
              />
              {errors[`announcement.${l}`] && <p className="text-sm text-destructive">{errors[`announcement.${l}`]}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Tiny abstract thumbnail hinting at each design language. */
function VariantSwatch({ variant }: { variant: VariantKey }) {
  const base = "mt-1 flex h-10 w-full max-w-40 gap-1 overflow-hidden rounded-md border bg-background p-1";
  if (variant === "bold")
    return (
      <span aria-hidden className={base}>
        <span className="h-full w-1/2 rounded-sm bg-foreground" />
        <span className="h-full w-1/2 rounded-sm bg-primary" />
      </span>
    );
  if (variant === "editorial")
    return (
      <span aria-hidden className={cn(base, "flex-col")}>
        <span className="h-1.5 w-2/3 rounded-sm bg-foreground/70" />
        <span className="h-1 w-full rounded-sm bg-muted-foreground/40" />
        <span className="h-1 w-5/6 rounded-sm bg-muted-foreground/40" />
      </span>
    );
  if (variant === "playful")
    return (
      <span aria-hidden className={cn(base, "items-center")}>
        <span className="size-5 rounded-full bg-accent" />
        <span className="size-5 rounded-full bg-primary" />
        <span className="h-3 flex-1 rounded-full bg-muted" />
      </span>
    );
  return (
    <span aria-hidden className={cn(base, "flex-col justify-center")}>
      <span className="h-1.5 w-1/2 rounded-sm bg-foreground/60" />
      <span className="h-1 w-1/3 rounded-sm bg-muted-foreground/40" />
    </span>
  );
}
