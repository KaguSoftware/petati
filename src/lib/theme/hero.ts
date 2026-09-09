import { z } from "zod";
import { locales, type Locale } from "@/i18n/config";

/**
 * Home-page hero content, stored in `stores.settings.hero_slides`: an ordered list of slides,
 * each with a photo (public URL in this store's media folder), per-locale headline/subtitle and
 * an optional same-site link for the button. One slide renders as a plain hero; two or more turn
 * every hero layout into a carousel. Older rows that only carry `hero_image` / `hero_title` /
 * `hero_subtitle` read as a single slide, and saving keeps those keys mirrored to slide 1.
 * Isomorphic: read by the storefront home, the admin design editor and the preview builder.
 */
export type LocaleText = Partial<Record<Locale, string>>;

export interface HeroSlide {
  imageUrl: string | null;
  title: LocaleText;
  subtitle: LocaleText;
  /** Same-site path the slide's button opens; null = the shop page. */
  link: string | null;
}

export interface HeroContent {
  slides: HeroSlide[];
}

export const MAX_HERO_SLIDES = 8;
export const EMPTY_SLIDE: HeroSlide = { imageUrl: null, title: {}, subtitle: {}, link: null };
export const EMPTY_HERO: HeroContent = { slides: [] };

const localeEnum = z.enum(locales);
/** A relative, same-site path ("/c/dog-food"); protocol-relative and absolute URLs are rejected. */
export const heroLinkSchema = z.string().trim().max(200).regex(/^\/(?!\/)[^\s]*$/, "path");

export const heroSlideSchema = z.object({
  imageUrl: z.string().trim().max(1000).nullable().optional(),
  title: z.partialRecord(localeEnum, z.string().trim().max(120)).optional(),
  subtitle: z.partialRecord(localeEnum, z.string().trim().max(300)).optional(),
  link: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), heroLinkSchema.nullable().optional()),
});

/** Payload accepted by `saveThemeAction`: the whole slide list replaces the stored one. */
export const heroInputSchema = z.object({ slides: z.array(heroSlideSchema).max(MAX_HERO_SLIDES) });
export type HeroInput = z.infer<typeof heroInputSchema>;

function localeRecord(value: unknown): LocaleText {
  const out: LocaleText = {};
  if (!value || typeof value !== "object") return out;
  for (const l of locales) {
    const v = (value as Record<string, unknown>)[l];
    if (typeof v === "string" && v.trim() !== "") out[l] = v;
  }
  return out;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function slideFrom(image: unknown, title: unknown, subtitle: unknown, link: unknown): HeroSlide {
  const href = text(link);
  return { imageUrl: text(image), title: localeRecord(title), subtitle: localeRecord(subtitle), link: href && heroLinkSchema.safeParse(href).success ? href : null };
}

function isEmptySlide(s: HeroSlide): boolean {
  return !s.imageUrl && Object.keys(s.title).length === 0 && Object.keys(s.subtitle).length === 0;
}

/** Tolerant read of the settings JSON (missing or malformed keys yield an empty hero). */
export function heroFromSettings(settings: Record<string, unknown> | null | undefined): HeroContent {
  const s = settings ?? {};
  if (Array.isArray(s.hero_slides)) {
    const slides = s.hero_slides
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map((x) => slideFrom(x.image, x.title, x.subtitle, x.link))
      .filter((x) => !isEmptySlide(x))
      .slice(0, MAX_HERO_SLIDES);
    return { slides };
  }
  // Legacy single-hero keys (rows saved before the carousel existed).
  const legacy = slideFrom(s.hero_image, s.hero_title, s.hero_subtitle, null);
  return { slides: isEmptySlide(legacy) ? [] : [legacy] };
}

/** Normalise a validated payload into stored shape (drops empty slides, trims text). */
export function heroFromInput(input: HeroInput): HeroContent {
  return {
    slides: input.slides
      .map((x) => slideFrom(x.imageUrl, x.title, x.subtitle, x.link))
      .filter((x) => !isEmptySlide(x))
      .slice(0, MAX_HERO_SLIDES),
  };
}

/** The settings keys to spread over `stores.settings` when saving; slide 1 is mirrored to the legacy keys. */
export function heroToSettings(hero: HeroContent): Record<string, unknown> {
  const first = hero.slides[0];
  return {
    hero_slides: hero.slides.map((s) => ({ image: s.imageUrl, title: s.title, subtitle: s.subtitle, link: s.link })),
    hero_image: first?.imageUrl ?? null,
    hero_title: first?.title ?? {},
    hero_subtitle: first?.subtitle ?? {},
  };
}

export interface ResolvedHeroSlide {
  title?: string;
  subtitle?: string;
  imageUrl: string | null;
  link: string | null;
}

/** Pick each slide's text for the locale (or the store default locale's); callers supply the last-resort wording. */
export function resolveHero(hero: HeroContent, locale: Locale, fallback: Locale): ResolvedHeroSlide[] {
  return hero.slides.map((s) => ({
    title: s.title[locale] ?? s.title[fallback] ?? Object.values(s.title).find(Boolean),
    subtitle: s.subtitle[locale] ?? s.subtitle[fallback] ?? Object.values(s.subtitle).find(Boolean),
    imageUrl: s.imageUrl,
    link: s.link,
  }));
}
