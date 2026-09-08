"use client";

import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PreviewFrame } from "@/components/admin/design/preview-frame";
import { dirFor, isLocale, localeNames, type Locale } from "@/i18n/config";
import { DEFAULT_THEME, SECTION_KEYS, VARIANT_KEYS, type SectionKey, type VariantKey } from "@/lib/theme/types";
import { cn } from "@/lib/utils";
import type { StepProps } from "./types";

interface Props extends StepProps {
  locale: string;
  /** Implemented variants per section (from the theme registry). */
  variants: Record<SectionKey, VariantKey[]>;
  showPreviewLinks: boolean;
  /** Composed home page per design language, server-rendered with sample data. */
  presetPreviews: Record<VariantKey, React.ReactNode[]>;
}

export function DesignStep({ draft, update, errors, locale, variants, showPreviewLinks, presetPreviews }: Props) {
  const t = useTranslations("stores.design");
  const tc = useTranslations("stores.wizard");
  const tl = useTranslations("admin.design.layouts");
  const sections = draft.sections;
  const values = SECTION_KEYS.map((k) => sections[k]);
  const preset = values.every((v) => v === values[0]) ? values[0] : "";
  const availableEverywhere = (v: VariantKey) => SECTION_KEYS.every((k) => variants[k]?.includes(v));
  const previewTheme = { ...DEFAULT_THEME, colors: draft.colors, radius: draft.radius };
  const dir = dirFor(isLocale(locale) ? locale : "en");

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
                  "flex flex-col items-stretch gap-2 rounded-xl border p-3 font-normal transition-colors has-data-checked:border-primary has-data-checked:bg-primary/5",
                  enabled ? "cursor-pointer hover:bg-muted/50" : "cursor-not-allowed opacity-70",
                )}
              >
                <span className="flex items-start gap-3">
                  <RadioGroupItem value={v} disabled={!enabled} className="mt-0.5" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{t(`variants.${v}.name`)}</span>
                      {!enabled && <Badge variant="secondary">{t("comingSoon")}</Badge>}
                    </span>
                    <span className="text-sm text-muted-foreground">{t(`variants.${v}.description`)}</span>
                  </span>
                </span>
                <PreviewFrame device="mobile" theme={previewTheme} dir={dir} label={t(`variants.${v}.name`)} maxHeight={1100} className="rounded-lg border">
                  {presetPreviews[v]}
                </PreviewFrame>
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
            const items = VARIANT_KEYS.map((v) => ({ value: v, label: tl(`${key}.${v}.name`) }));
            return (
              <div key={key} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                <Label htmlFor={`sections.${key}`} className="font-normal">
                  {t(`sectionNames.${key}`)}
                </Label>
                <Select items={items} value={sections[key]} onValueChange={(v) => v && update({ sections: { ...sections, [key]: v as VariantKey } })}>
                  <SelectTrigger id={`sections.${key}`} size="sm" className="w-40" aria-invalid={!!errors[`sections.${key}`] || undefined}>
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
