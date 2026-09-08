"use client";

import { ExternalLink, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { localeNames, type Locale } from "@/i18n/config";
import { saveThemeAction } from "@/lib/admin/design/actions";
import { FONT_OPTIONS, RADIUS_PRESETS, THEME_COLOR_KEYS } from "@/lib/admin/design/constants";
import { SECTION_KEYS, VARIANT_KEYS, themeToCssVars, type SectionKey, type StoreTheme, type VariantKey } from "@/lib/theme/types";
import { cn } from "@/lib/utils";
import { useActionToast } from "../shared/use-action-toast";
import { ColorField } from "./color-field";

interface Props {
  storeId: string;
  storeName: string;
  locale: Locale;
  theme: StoreTheme;
  enabledLocales: Locale[];
  /** Implemented variants per section (from the registry); the rest render as "coming soon". */
  available: Record<SectionKey, VariantKey[]>;
  /** Dev-only preview harness link; evaluated on the server. */
  previewHref: string | null;
}

export function ThemeEditor({ storeId, storeName, locale, theme, enabledLocales, available, previewHref }: Props) {
  const t = useTranslations("admin.design");
  const tc = useTranslations("admin.common");
  const [draft, setDraft] = useState<StoreTheme>(theme);
  const [saved, setSaved] = useState(() => JSON.stringify(theme));
  const [state, action, pending] = useActionToast(saveThemeAction, {
    errorNamespace: "admin.design",
    onSuccess: () => setSaved(JSON.stringify(draft)),
  });
  const dirty = JSON.stringify(draft) !== saved;

  const patch = (p: Partial<StoreTheme>) => setDraft((d) => ({ ...d, ...p }));
  const announcementLocales = enabledLocales.length ? enabledLocales : [locale];

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="theme" value={JSON.stringify(draft)} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Colours */}
          <Card>
            <CardHeader>
              <CardTitle>{t("colors.title")}</CardTitle>
              <CardDescription>{t("colors.description")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {THEME_COLOR_KEYS.map((key) => (
                <ColorField
                  key={key}
                  name={`color_${key}`}
                  id={`color_${key}`}
                  label={t(`colors.${key}`)}
                  defaultValue={theme.colors[key]}
                  value={draft.colors[key]}
                  onChange={(hex) => patch({ colors: { ...draft.colors, [key]: hex } })}
                />
              ))}
            </CardContent>
          </Card>

          {/* Radius + fonts */}
          <Card>
            <CardHeader>
              <CardTitle>{t("shape.title")}</CardTitle>
              <CardDescription>{t("shape.description")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label>{t("shape.radius")}</Label>
                <RadioGroup value={draft.radius} onValueChange={(v) => patch({ radius: String(v) })} className="grid-cols-2 sm:grid-cols-4">
                  {RADIUS_PRESETS.map((r) => (
                    <label
                      key={r.value}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50",
                        draft.radius === r.value && "border-primary bg-primary/5",
                      )}
                    >
                      <RadioGroupItem value={r.value} aria-label={t(`shape.radiusPresets.${r.key}`)} />
                      <span aria-hidden className="size-7 shrink-0 border-2 border-foreground/60 bg-muted" style={{ borderRadius: r.value }} />
                      <span className="text-sm">{t(`shape.radiusPresets.${r.key}`)}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {(["heading", "body"] as const).map((slot) => (
                  <div key={slot} className="flex flex-col gap-2">
                    <Label htmlFor={`font_${slot}`}>{t(`shape.font.${slot}`)}</Label>
                    <Select value={draft.fonts[slot]} onValueChange={(v) => patch({ fonts: { ...draft.fonts, [slot]: String(v) } })} modal={false}>
                      <SelectTrigger id={`font_${slot}`} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        {FONT_OPTIONS.map((f) => (
                          <SelectItem key={f} value={f}>
                            <span style={{ fontFamily: `"${f}", sans-serif` }}>{f}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              {/* SCOPE(design): fonts are saved but the storefront does not load them yet. GROWS LATER → per-store next/font. */}
              <p className="text-xs text-muted-foreground">{t("shape.fontNote")}</p>
            </CardContent>
          </Card>

          {/* Announcement */}
          <Card>
            <CardHeader>
              <CardTitle>{t("announcement.title")}</CardTitle>
              <CardDescription>{t("announcement.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={announcementLocales.includes(locale) ? locale : announcementLocales[0]}>
                <TabsList>
                  {announcementLocales.map((l) => (
                    <TabsTrigger key={l} value={l}>
                      {localeNames[l]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {announcementLocales.map((l) => (
                  <TabsContent key={l} value={l}>
                    <Textarea
                      dir={l === "fa" ? "rtl" : "ltr"}
                      rows={2}
                      maxLength={200}
                      value={draft.announcement[l] ?? ""}
                      placeholder={t("announcement.placeholder")}
                      aria-label={`${t("announcement.title")} (${localeNames[l]})`}
                      onChange={(e) => {
                        const next = { ...draft.announcement };
                        if (e.target.value.trim() === "") delete next[l];
                        else next[l] = e.target.value;
                        patch({ announcement: next });
                      }}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Section variants */}
          <Card>
            <CardHeader>
              <CardTitle>{t("sections.title")}</CardTitle>
              <CardDescription>{t("sections.description")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col divide-y">
              {SECTION_KEYS.map((key) => (
                <div key={key} className="grid gap-2 py-3 first:pt-0 last:pb-0 md:grid-cols-[10rem_1fr] md:items-center">
                  <Label className="text-sm font-medium">{t(`sections.keys.${key}`)}</Label>
                  <RadioGroup
                    value={draft.sections[key]}
                    onValueChange={(v) => patch({ sections: { ...draft.sections, [key]: v as VariantKey } })}
                    className="grid-cols-2 gap-1.5 xl:grid-cols-4"
                    aria-label={t(`sections.keys.${key}`)}
                  >
                    {VARIANT_KEYS.map((v) => {
                      const enabled = available[key].includes(v);
                      const selected = draft.sections[key] === v;
                      return (
                        <label
                          key={v}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition-colors",
                            enabled ? "cursor-pointer hover:bg-muted/50" : "cursor-not-allowed opacity-60",
                            selected && "border-primary bg-primary/5",
                          )}
                        >
                          <RadioGroupItem value={v} disabled={!enabled} />
                          <span className="flex min-w-0 flex-col leading-tight">
                            <span className="truncate">{t(`variants.${v}`)}</span>
                            {!enabled && <span className="truncate text-[10px] text-muted-foreground">{tc("comingSoon")}</span>}
                          </span>
                        </label>
                      );
                    })}
                  </RadioGroup>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Live preview */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">{t("preview.title")}</h2>
            <div className="flex items-center gap-1">
              <a href={`/${locale}`} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                {t("preview.openStorefront")}
                <ExternalLink data-icon="inline-end" />
              </a>
              {previewHref && (
                <a href={previewHref} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  {t("preview.harness")}
                  <ExternalLink data-icon="inline-end" />
                </a>
              )}
            </div>
          </div>
          <ThemePreview theme={draft} storeName={storeName} locale={locale} />
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <p className="text-sm text-muted-foreground">{dirty ? t("unsaved") : t("allSaved")}</p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" disabled={!dirty || pending} onClick={() => setDraft(JSON.parse(saved) as StoreTheme)}>
            <RotateCcw data-icon="inline-start" />
            {t("reset")}
          </Button>
          <Button type="submit" disabled={!dirty || pending}>
            {pending ? tc("saving") : tc("save")}
          </Button>
        </div>
      </div>
      {state.fieldErrors?.theme && <p className="text-sm text-destructive">{tc("errors.invalid")}</p>}
    </form>
  );
}

/** Mock storefront skinned with the draft's CSS variables (same mapping as the real layout). */
function ThemePreview({ theme, storeName, locale }: { theme: StoreTheme; storeName: string; locale: Locale }) {
  const t = useTranslations("admin.design.preview");
  const announcement = theme.announcement[locale] ?? Object.values(theme.announcement).find(Boolean) ?? "";
  const headingFont = `"${theme.fonts.heading}", var(--font-sans), sans-serif`;
  const bodyFont = `"${theme.fonts.body}", var(--font-sans), sans-serif`;
  return (
    <div
      data-theme-preview
      dir={locale === "fa" ? "rtl" : "ltr"}
      className="overflow-hidden rounded-xl border bg-background text-foreground shadow-sm"
      style={{ ...(themeToCssVars(theme) as React.CSSProperties), fontFamily: bodyFont }}
    >
      {announcement && <div className="bg-primary px-4 py-1.5 text-center text-xs text-primary-foreground">{announcement}</div>}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold" style={{ fontFamily: headingFont }}>
          {storeName}
        </span>
        <span className="flex gap-3 text-xs text-muted-foreground">
          <span>{t("navShop")}</span>
          <span>{t("navAbout")}</span>
        </span>
      </div>
      <div className="flex flex-col gap-3 px-4 py-6">
        <h3 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: headingFont }}>
          {t("heroTitle")}
        </h3>
        <p className="text-sm text-muted-foreground">{t("heroText")}</p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-9 items-center bg-primary px-4 text-sm font-medium text-primary-foreground" style={{ borderRadius: "var(--radius)" }}>
            {t("primaryButton")}
          </span>
          <span className="inline-flex h-9 items-center border border-foreground/20 px-4 text-sm font-medium" style={{ borderRadius: "var(--radius)" }}>
            {t("outlineButton")}
          </span>
        </div>
      </div>
      <div className="bg-muted px-4 py-4">
        <div className="max-w-40 overflow-hidden bg-background shadow-sm" style={{ borderRadius: "var(--radius)" }}>
          <div className="relative aspect-square bg-gradient-to-br from-primary/30 via-muted to-accent/40">
            <span className="absolute start-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">{t("badge")}</span>
          </div>
          <div className="flex flex-col gap-0.5 p-2.5">
            <span className="truncate text-sm font-medium">{t("productName")}</span>
            <span className="text-xs text-muted-foreground">{t("productPrice")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
