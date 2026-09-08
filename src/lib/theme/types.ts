import { z } from "zod";
import { fontStack } from "./fonts";

/** Every storefront section that has four interchangeable variants. */
export const SECTION_KEYS = [
  "announcementBar",
  "navbar",
  "hero",
  "categoryBanner",
  "productGrid",
  "productCard",
  "productPage",
  "cartDrawer",
  "checkout",
  "reviews",
  "newsletter",
  "footer",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

/** The four design languages. Provisional names; rename freely (also in seed.sql). */
export const VARIANT_KEYS = ["minimal", "bold", "editorial", "playful"] as const;
export type VariantKey = (typeof VARIANT_KEYS)[number];

const hex = z.string().regex(/^#[0-9a-f]{6}$/i, "hex colour");
const variant = z.enum(VARIANT_KEYS);

export const themeColorsSchema = z.object({
  primary: hex,
  primaryForeground: hex,
  accent: hex,
  accentForeground: hex,
  background: hex,
  foreground: hex,
  muted: hex,
  mutedForeground: hex,
});
export type ThemeColors = z.infer<typeof themeColorsSchema>;

export const themeSchema = z.object({
  sections: z.record(z.enum(SECTION_KEYS), variant),
  colors: themeColorsSchema,
  fonts: z.object({ heading: z.string().min(1), body: z.string().min(1) }),
  radius: z.string().min(1),
  /** per-locale announcement text, empty = hidden */
  announcement: z.record(z.string(), z.string()),
});
export type StoreTheme = z.infer<typeof themeSchema>;

export const DEFAULT_THEME: StoreTheme = {
  sections: Object.fromEntries(SECTION_KEYS.map((k) => [k, "minimal"])) as Record<
    SectionKey,
    VariantKey
  >,
  colors: {
    primary: "#0f766e",
    primaryForeground: "#ffffff",
    accent: "#f59e0b",
    accentForeground: "#1c1917",
    background: "#ffffff",
    foreground: "#0c0a09",
    muted: "#f5f5f4",
    mutedForeground: "#57534e",
  },
  fonts: { heading: "Inter", body: "Inter" },
  radius: "0.75rem",
  announcement: {},
};

const partialThemeSchema = z
  .object({
    sections: z.record(z.string(), variant).optional(),
    colors: themeColorsSchema.partial().optional(),
    fonts: z.object({ heading: z.string().optional(), body: z.string().optional() }).optional(),
    radius: z.string().optional(),
    announcement: z.record(z.string(), z.string()).optional(),
  })
  .passthrough();

/** Tolerant parse: unknown/partial JSON from the DB always yields a full theme. */
export function parseTheme(input: unknown): StoreTheme {
  const result = partialThemeSchema.safeParse(input ?? {});
  if (!result.success) return DEFAULT_THEME;
  const p = result.data;
  const sections = { ...DEFAULT_THEME.sections };
  for (const key of SECTION_KEYS) {
    const v = p.sections?.[key];
    if (v) sections[key] = v;
  }
  return {
    sections,
    colors: { ...DEFAULT_THEME.colors, ...stripUndefined(p.colors ?? {}) },
    fonts: { ...DEFAULT_THEME.fonts, ...stripUndefined(p.fonts ?? {}) },
    radius: p.radius ?? DEFAULT_THEME.radius,
    announcement: p.announcement ?? {},
  };
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** CSS custom properties that re-skin shadcn tokens for the storefront subtree. */
export function themeToCssVars(theme: StoreTheme): Record<string, string> {
  const c = theme.colors;
  return {
    "--primary": c.primary,
    "--primary-foreground": c.primaryForeground,
    "--accent": c.accent,
    "--accent-foreground": c.accentForeground,
    "--background": c.background,
    "--foreground": c.foreground,
    "--card": c.background,
    "--card-foreground": c.foreground,
    "--popover": c.background,
    "--popover-foreground": c.foreground,
    "--muted": c.muted,
    "--muted-foreground": c.mutedForeground,
    "--secondary": c.muted,
    "--secondary-foreground": c.foreground,
    "--ring": c.primary,
    "--radius": theme.radius,
    // Fonts: the storefront wrapper carries `font-sans`, headings read `--font-heading` (globals.css).
    "--font-sans": fontStack(theme.fonts.body),
    "--heading-font": fontStack(theme.fonts.heading),
  };
}
