import { z } from "zod";
import { locales, type Locale } from "@/i18n/config";
import type { LocaleText } from "./hero";

/**
 * Footer / contact content kept in `stores.settings` (`address`, `opening_hours`, `social_links`,
 * `trust_enabled`, `trust_items`, `payment_methods`). Isomorphic like `hero.ts`: tolerant reads for
 * the storefront and the preview builder, a zod input schema for the admin action, and a
 * per-locale resolver. Edited under Admin → Settings → Contact & footer.
 */
export const SOCIAL_KEYS = ["instagram", "facebook", "whatsapp", "telegram", "x"] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];

export const TRUST_ICONS = ["truck", "shield-check", "rotate-ccw", "headset", "badge-percent", "gift"] as const;
export type TrustIcon = (typeof TRUST_ICONS)[number];

export const PAYMENT_METHODS = ["visa", "mastercard", "troy", "iyzico", "cash_on_delivery", "bank_transfer"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const MAX_TRUST_ITEMS = 4;

export interface TrustItem {
  icon: TrustIcon;
  title: LocaleText;
  text: LocaleText;
}

export interface FooterContent {
  /** Multi-line, per locale. */
  address: LocaleText;
  /** Multi-line, per locale (e.g. "Mon–Sat 9:00–19:00"). */
  hours: LocaleText;
  /** Absolute https URLs. */
  social: Partial<Record<SocialKey, string>>;
  trustEnabled: boolean;
  /** Empty = the four default promises from the `footer.trust.*` messages. */
  trustItems: TrustItem[];
  /** Empty = no payment badges. */
  payments: PaymentMethod[];
}

export const EMPTY_FOOTER: FooterContent = { address: {}, hours: {}, social: {}, trustEnabled: true, trustItems: [], payments: [] };

/** Hosts each network may link to (subdomains allowed); WhatsApp accepts wa.me links. */
export const SOCIAL_HOSTS: Record<SocialKey, string[]> = {
  instagram: ["instagram.com"],
  facebook: ["facebook.com", "fb.com"],
  whatsapp: ["wa.me", "whatsapp.com"],
  telegram: ["t.me", "telegram.me"],
  x: ["x.com", "twitter.com"],
};

const localeEnum = z.enum(locales);
const localeText = (max: number) => z.partialRecord(localeEnum, z.string().trim().max(max)).optional();
const blankToUndef = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

/** Why a social URL is rejected, for inline hints: "https" | "invalidUrl" | "socialHost". */
export function socialUrlProblem(key: SocialKey, value: string): "https" | "invalidUrl" | "socialHost" | null {
  const v = value.trim();
  if (v === "") return null;
  if (!/^https:\/\//i.test(v)) return "https";
  let host: string;
  try {
    host = new URL(v).hostname.toLowerCase();
  } catch {
    return "invalidUrl";
  }
  if (v.length > 300) return "invalidUrl";
  return SOCIAL_HOSTS[key].some((d) => host === d || host.endsWith(`.${d}`)) ? null : "socialHost";
}

const socialUrl = (key: SocialKey) => z.preprocess(blankToUndef, z.string().trim().refine((v) => socialUrlProblem(key, v) === null, "invalid").optional());

export const footerInputSchema = z.object({
  address: localeText(400),
  hours: localeText(300),
  social: z
    .object({ instagram: socialUrl("instagram"), facebook: socialUrl("facebook"), whatsapp: socialUrl("whatsapp"), telegram: socialUrl("telegram"), x: socialUrl("x") })
    .optional(),
  trustEnabled: z.boolean().optional(),
  trustItems: z.array(z.object({ icon: z.enum(TRUST_ICONS), title: localeText(40), text: localeText(120) })).max(MAX_TRUST_ITEMS).optional(),
  payments: z.array(z.enum(PAYMENT_METHODS)).max(PAYMENT_METHODS.length).optional(),
});
export type FooterInput = z.infer<typeof footerInputSchema>;

function localeRecord(value: unknown): LocaleText {
  const out: LocaleText = {};
  if (!value || typeof value !== "object") return out;
  for (const l of locales) {
    const v = (value as Record<string, unknown>)[l];
    if (typeof v === "string" && v.trim() !== "") out[l] = v.trim();
  }
  return out;
}

function socialRecord(value: unknown): Partial<Record<SocialKey, string>> {
  const out: Partial<Record<SocialKey, string>> = {};
  if (!value || typeof value !== "object") return out;
  for (const k of SOCIAL_KEYS) {
    const v = (value as Record<string, unknown>)[k];
    if (typeof v === "string" && v.trim() !== "" && socialUrlProblem(k, v) === null) out[k] = v.trim();
  }
  return out;
}

function trustItems(value: unknown): TrustItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({ icon: (TRUST_ICONS as readonly string[]).includes(String(x.icon)) ? (x.icon as TrustIcon) : "truck", title: localeRecord(x.title), text: localeRecord(x.text) }))
    .filter((x) => Object.keys(x.title).length > 0)
    .slice(0, MAX_TRUST_ITEMS);
}

function payments(value: unknown): PaymentMethod[] {
  if (!Array.isArray(value)) return [];
  return PAYMENT_METHODS.filter((m) => value.includes(m));
}

/** Tolerant read of the settings JSON (missing or malformed keys yield the defaults). */
export function footerFromSettings(settings: Record<string, unknown> | null | undefined): FooterContent {
  const s = settings ?? {};
  return {
    address: localeRecord(s.address),
    hours: localeRecord(s.opening_hours),
    social: socialRecord(s.social_links),
    trustEnabled: s.trust_enabled !== false,
    trustItems: trustItems(s.trust_items),
    payments: payments(s.payment_methods),
  };
}

/** Normalise a validated payload into stored shape. */
export function footerFromInput(input: FooterInput): FooterContent {
  return {
    address: localeRecord(input.address),
    hours: localeRecord(input.hours),
    social: socialRecord(input.social),
    trustEnabled: input.trustEnabled !== false,
    trustItems: trustItems(input.trustItems),
    payments: payments(input.payments),
  };
}

/** The settings keys to spread over `stores.settings` when saving. */
export function footerToSettings(f: FooterContent): Record<string, unknown> {
  return {
    address: f.address,
    opening_hours: f.hours,
    social_links: f.social,
    trust_enabled: f.trustEnabled,
    trust_items: f.trustItems.map((t) => ({ icon: t.icon, title: t.title, text: t.text })),
    payment_methods: f.payments,
  };
}

export interface ResolvedFooter {
  address: string | null;
  hours: string | null;
  social: { key: SocialKey; href: string }[];
  /** null = strip disabled; [] = enabled with the message defaults. */
  trustItems: { icon: TrustIcon; title?: string; text?: string }[] | null;
  payments: PaymentMethod[];
}

function pick(text: LocaleText, locale: Locale, fallback: Locale): string | undefined {
  return text[locale] ?? text[fallback] ?? Object.values(text).find(Boolean);
}

/** Pick the locale's text (or the store default locale's); callers supply the last-resort wording. */
export function resolveFooter(f: FooterContent, locale: Locale, fallback: Locale): ResolvedFooter {
  return {
    address: pick(f.address, locale, fallback) ?? null,
    hours: pick(f.hours, locale, fallback) ?? null,
    social: SOCIAL_KEYS.flatMap((key) => (f.social[key] ? [{ key, href: f.social[key]! }] : [])),
    trustItems: f.trustEnabled ? f.trustItems.map((t) => ({ icon: t.icon, title: pick(t.title, locale, fallback), text: pick(t.text, locale, fallback) })) : null,
    payments: f.payments,
  };
}
