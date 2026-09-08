import { z } from "zod";
import { locales, type Locale } from "@/i18n/config";

/**
 * Home-page hero content, stored in `stores.settings` as `hero_title` / `hero_subtitle`
 * (per-locale records) and `hero_image` (public URL in this store's media folder). Isomorphic:
 * read by the storefront home, the admin design editor and the preview builder.
 */
export interface HeroContent {
  title: Partial<Record<Locale, string>>;
  subtitle: Partial<Record<Locale, string>>;
  imageUrl: string | null;
}

export const EMPTY_HERO: HeroContent = { title: {}, subtitle: {}, imageUrl: null };

const localeEnum = z.enum(locales);

/** Patch accepted by `saveThemeAction`: every part optional, merged into the stored hero. */
export const heroPatchSchema = z.object({
  title: z.partialRecord(localeEnum, z.string().trim().max(120)).optional(),
  subtitle: z.partialRecord(localeEnum, z.string().trim().max(300)).optional(),
  imageUrl: z.string().trim().max(1000).nullable().optional(),
});
export type HeroPatch = z.infer<typeof heroPatchSchema>;

function localeRecord(value: unknown): Partial<Record<Locale, string>> {
  const out: Partial<Record<Locale, string>> = {};
  if (!value || typeof value !== "object") return out;
  for (const l of locales) {
    const v = (value as Record<string, unknown>)[l];
    if (typeof v === "string" && v.trim() !== "") out[l] = v;
  }
  return out;
}

/** Tolerant read of the settings JSON (missing or malformed keys yield an empty hero). */
export function heroFromSettings(settings: Record<string, unknown> | null | undefined): HeroContent {
  const s = settings ?? {};
  const image = s.hero_image;
  return {
    title: localeRecord(s.hero_title),
    subtitle: localeRecord(s.hero_subtitle),
    imageUrl: typeof image === "string" && image.trim() !== "" ? image : null,
  };
}

/** The settings keys to spread over `stores.settings` when saving. */
export function heroToSettings(hero: HeroContent): Record<string, unknown> {
  return { hero_title: localeRecord(hero.title), hero_subtitle: localeRecord(hero.subtitle), hero_image: hero.imageUrl };
}

export function mergeHero(current: HeroContent, patch: HeroPatch): HeroContent {
  return {
    title: patch.title ? localeRecord(patch.title) : current.title,
    subtitle: patch.subtitle ? localeRecord(patch.subtitle) : current.subtitle,
    imageUrl: patch.imageUrl === undefined ? current.imageUrl : patch.imageUrl,
  };
}

/** Pick the locale's text (or the store default locale's); callers supply the last-resort message. */
export function resolveHero(hero: HeroContent, locale: Locale, fallback: Locale): { title?: string; subtitle?: string; imageUrl: string | null } {
  return {
    title: hero.title[locale] ?? hero.title[fallback],
    subtitle: hero.subtitle[locale] ?? hero.subtitle[fallback],
    imageUrl: hero.imageUrl,
  };
}
