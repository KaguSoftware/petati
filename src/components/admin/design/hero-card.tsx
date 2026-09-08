"use client";

import { ImageIcon, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { dirFor, localeNames, type Locale } from "@/i18n/config";
import type { HeroContent } from "@/lib/theme/hero";
import { ImageUploader } from "../shared/image-uploader";

interface Props {
  storeId: string;
  locale: Locale;
  locales: Locale[];
  hero: HeroContent;
  onChange: (hero: HeroContent) => void;
}

/** Hero image + per-locale headline/subtitle. Edits land in the editor draft and save with the theme. */
export function HeroCard({ storeId, locale, locales, hero, onChange }: Props) {
  const t = useTranslations("admin.design.hero");
  const tc = useTranslations("admin.common");

  const setText = (field: "title" | "subtitle", l: Locale, value: string) => {
    const next = { ...hero[field] };
    if (value.trim() === "") delete next[l];
    else next[l] = value;
    onChange({ ...hero, [field]: next });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label>{t("image")}</Label>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,20rem)_1fr] sm:items-start">
            <div className="grid aspect-[12/5] w-full place-items-center overflow-hidden rounded-lg border bg-[repeating-conic-gradient(var(--color-muted)_0%_25%,transparent_0%_50%)] bg-[length:12px_12px]">
              {hero.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- storage host varies per environment
                <img src={hero.imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <ImageUploader storeId={storeId} folder="hero" label={hero.imageUrl ? t("replace") : t("upload")} onUploaded={(url) => onChange({ ...hero, imageUrl: url })} />
                {hero.imageUrl && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => onChange({ ...hero, imageUrl: null })}>
                    <Trash2 data-icon="inline-start" />
                    {tc("remove")}
                  </Button>
                )}
              </div>
              {hero.imageUrl ? (
                <p dir="ltr" className="truncate text-xs text-muted-foreground" title={hero.imageUrl}>
                  {hero.imageUrl.split("/").pop()}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">{t("noImage")}</p>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue={locales.includes(locale) ? locale : locales[0]}>
          <TabsList>
            {locales.map((l) => (
              <TabsTrigger key={l} value={l} className="leading-5">
                {localeNames[l]}
              </TabsTrigger>
            ))}
          </TabsList>
          {locales.map((l) => (
            <TabsContent key={l} value={l} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`hero_title_${l}`}>{t("headline")}</Label>
                <Input id={`hero_title_${l}`} dir={dirFor(l)} maxLength={120} value={hero.title[l] ?? ""} placeholder={t("headlinePlaceholder")} onChange={(e) => setText("title", l, e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`hero_subtitle_${l}`}>{t("subtitle")}</Label>
                <Textarea id={`hero_subtitle_${l}`} dir={dirFor(l)} rows={2} maxLength={300} value={hero.subtitle[l] ?? ""} placeholder={t("subtitlePlaceholder")} onChange={(e) => setText("subtitle", l, e.target.value)} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <p className="text-xs text-muted-foreground">{t("fallbackNote")}</p>
      </CardContent>
    </Card>
  );
}
