import { locales } from "@/i18n/config";
import { DEFAULT_THEME, SECTION_KEYS, type SectionKey, type VariantKey } from "@/lib/theme/types";
import { CURRENCIES, RADIUS_PRESETS, type CreateStoreInput, type RadiusPreset } from "./schema";

/** Currency choices for the wizard (label = code; the symbol comes from Intl at render time). */
export const CURRENCY_OPTIONS = CURRENCIES.map((code) => ({ value: code, label: code }));

export const RADIUS_OPTIONS: { value: RadiusPreset; key: "none" | "small" | "medium" | "large" }[] = [
  { value: RADIUS_PRESETS[0], key: "none" },
  { value: RADIUS_PRESETS[1], key: "small" },
  { value: RADIUS_PRESETS[2], key: "medium" },
  { value: RADIUS_PRESETS[3], key: "large" },
];

/** Swatches offered by the colour picker: the default theme colours plus a fixed set. */
export const PALETTE_SWATCHES: string[] = Array.from(
  new Set([
    ...Object.values(DEFAULT_THEME.colors),
    "#000000",
    "#1e293b",
    "#334155",
    "#64748b",
    "#94a3b8",
    "#e2e8f0",
    "#f8fafc",
    "#dc2626",
    "#ea580c",
    "#ca8a04",
    "#16a34a",
    "#0d9488",
    "#0284c7",
    "#4f46e5",
    "#9333ea",
    "#db2777",
  ]),
).slice(0, 20);

/** "Café Pati & Co." → "cafe-pati-co" (single DNS label, ≤ 40 chars). */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

export function defaultDraft(): CreateStoreInput {
  return {
    name: "",
    slug: "",
    tagline: "",
    defaultLocale: "en",
    enabledLocales: [...locales],
    currency: "TRY",
    taxRateBp: 2000,
    pricesIncludeTax: true,
    lowStockThreshold: 5,
    colors: { ...DEFAULT_THEME.colors },
    radius: "0.75rem",
    sections: Object.fromEntries(SECTION_KEYS.map((k) => [k, "minimal"])) as Record<SectionKey, VariantKey>,
    announcement: {},
    contactEmail: "",
    contactPhone: "",
    emailFrom: "",
    customDomain: "",
  };
}

/** Mirrors supabase/seeds/01_store.sql: a store without a shipping rate cannot check out. */
export const DEFAULT_SHIPPING_RATES = [
  { name: { en: "Standard delivery", tr: "Standart teslimat", fa: "ارسال عادی" }, rate: 4990, free_over: 50000, cost: 0, min_days: 2, max_days: 5, sort_order: 0 },
];

/** Mirrors supabase/seeds/01_store.sql. */
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Stock purchase", sort_order: 0 },
  { name: "Marketing", sort_order: 1 },
  { name: "Shipping supplies", sort_order: 2 },
  { name: "Rent & utilities", sort_order: 3 },
  { name: "Other", sort_order: 4 },
];

/** Allowed logo uploads: MIME → file extension. */
export const LOGO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

/** sessionStorage key of the wizard draft (cleared by the list page after a successful create). */
export const DRAFT_STORAGE_KEY = "petitati:create-store-draft";
