import { z } from "zod";
import { locales, type Locale } from "@/i18n/config";
import { RESERVED_SUBDOMAINS } from "@/lib/tenant/resolve";
import { SECTION_KEYS, VARIANT_KEYS, themeColorsSchema, type SectionKey, type VariantKey } from "@/lib/theme/types";

/**
 * Create-store wizard validation. Plain module: imported by the client wizard (per-step checks)
 * and by the server action (whole payload). Every message is a key under `stores.fieldErrors.*`.
 * SCOPE(multi-store, unpaid): hidden behind FEATURE_MULTI_STORE + Owner.
 */

export const CURRENCIES = ["TRY", "USD", "EUR", "GBP", "IRR", "AED", "SAR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const RADIUS_PRESETS = ["0rem", "0.375rem", "0.75rem", "1.25rem"] as const;
export type RadiusPreset = (typeof RADIUS_PRESETS)[number];

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
export const HEX_RE = /^#[0-9a-f]{6}$/i;
/** Lowercase FQDN: at least two labels, each 1–63 chars, letters/digits/dashes, TLD letters only. */
export const HOSTNAME_RE = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const EMAIL_FROM_RE = /^(?:[^<>\n]{1,80}\s<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>|[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)$/;

const localeEnum = z.enum(locales, { error: "invalid" });
const optionalTrimmed = (max: number) => z.string().trim().max(max, "tooLong").optional().default("");

export const basicsSchema = z.object({
  name: z.string().trim().min(2, "tooShort").max(80, "tooLong"),
  slug: z
    .string()
    .trim()
    .min(3, "tooShort")
    .max(40, "tooLong")
    .regex(SLUG_RE, "invalid")
    .refine((s) => !RESERVED_SUBDOMAINS.has(s), "reserved"),
  tagline: optionalTrimmed(140),
});

const localesMoneyBase = z.object({
  defaultLocale: localeEnum,
  enabledLocales: z.array(localeEnum).min(1, "atLeastOne"),
  currency: z.enum(CURRENCIES, { error: "invalid" }),
  taxRateBp: z.number().int("invalid").min(0, "invalid").max(10000, "invalid"),
  pricesIncludeTax: z.boolean(),
  lowStockThreshold: z.number().int("invalid").min(0, "invalid").max(1000, "invalid"),
});
const includesDefault = (v: { defaultLocale: Locale; enabledLocales: Locale[] }, ctx: z.RefinementCtx) => {
  if (!v.enabledLocales.includes(v.defaultLocale)) {
    ctx.addIssue({ code: "custom", path: ["enabledLocales"], message: "includesDefault" });
  }
};
export const localesMoneySchema = localesMoneyBase.superRefine(includesDefault);

export const brandingSchema = z.object({
  colors: themeColorsSchema,
  radius: z.enum(RADIUS_PRESETS, { error: "invalid" }),
});

export const designSchema = z.object({
  sections: z.object(Object.fromEntries(SECTION_KEYS.map((k) => [k, z.enum(VARIANT_KEYS, { error: "invalid" })])) as Record<SectionKey, z.ZodEnum<{ [K in VariantKey]: K }>>),
  announcement: z.partialRecord(localeEnum, z.string().trim().max(120, "tooLong")),
});

export const contactSchema = z.object({
  contactEmail: z.string().trim().max(200, "tooLong").refine((v) => v === "" || EMAIL_RE.test(v), "invalid").optional().default(""),
  contactPhone: optionalTrimmed(40),
  emailFrom: z.string().trim().max(200, "tooLong").refine((v) => v === "" || EMAIL_FROM_RE.test(v), "invalid").optional().default(""),
});

export const domainSchema = z.object({
  customDomain: z
    .string()
    .trim()
    .toLowerCase()
    .max(253, "tooLong")
    .refine((v) => v === "" || HOSTNAME_RE.test(v), "invalid")
    .optional()
    .default(""),
});

export const createStoreSchema = z
  .object({
    ...basicsSchema.shape,
    ...localesMoneyBase.shape,
    ...brandingSchema.shape,
    ...designSchema.shape,
    ...contactSchema.shape,
    ...domainSchema.shape,
  })
  .superRefine(includesDefault);

export type CreateStoreInput = z.input<typeof createStoreSchema>;
export type CreateStorePayload = z.output<typeof createStoreSchema>;

export const STEP_ORDER = ["basics", "localesMoney", "branding", "design", "contact", "domain", "review"] as const;
export type WizardStep = (typeof STEP_ORDER)[number];

export const STEP_SCHEMAS: Record<Exclude<WizardStep, "review">, z.ZodType> = {
  basics: basicsSchema,
  localesMoney: localesMoneySchema,
  branding: brandingSchema,
  design: designSchema,
  contact: contactSchema,
  domain: domainSchema,
};

const STEP_FIELDS: Record<string, WizardStep> = {
  name: "basics",
  slug: "basics",
  tagline: "basics",
  defaultLocale: "localesMoney",
  enabledLocales: "localesMoney",
  currency: "localesMoney",
  taxRateBp: "localesMoney",
  pricesIncludeTax: "localesMoney",
  lowStockThreshold: "localesMoney",
  colors: "branding",
  radius: "branding",
  sections: "design",
  announcement: "design",
  contactEmail: "contact",
  contactPhone: "contact",
  emailFrom: "contact",
  customDomain: "domain",
};

/** Which wizard step owns a field path such as "colors.primary" or "slug". */
export function stepForPath(path: string): WizardStep {
  return STEP_FIELDS[path.split(".")[0]] ?? "basics";
}

/** Zod issues → `{ "colors.primary": "invalid" }` (first issue per dotted path wins). */
export function issuesToFieldErrors(issues: readonly z.core.$ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.length ? issue.path.map(String).join(".") : "_";
    if (!out[key]) out[key] = normaliseMessage(issue);
  }
  return out;
}

/** Zod's own messages (e.g. "Invalid input") become the generic key so the UI can translate them. */
function normaliseMessage(issue: z.core.$ZodIssue): string {
  const m = issue.message;
  if (/^[a-zA-Z]+$/.test(m)) return m;
  if (issue.code === "invalid_type" && (issue as { input?: unknown }).input === undefined) return "required";
  return "invalid";
}

/**
 * True when `hostname` is the platform root domain or sits under it (those are subdomains and
 * must go through the slug instead of a custom-domain row).
 */
export function hostnameConflictsWithRoot(hostname: string, rootDomain: string): boolean {
  const root = rootDomain.toLowerCase().split(":")[0];
  const h = hostname.toLowerCase();
  return h === root || h.endsWith(`.${root}`);
}
