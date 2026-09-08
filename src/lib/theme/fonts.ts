/**
 * Fonts a store may pick in the design editor. Every entry is loaded once by the root layout
 * through `next/font/google` and exposed as a CSS variable; the storefront wrapper then maps the
 * theme's choice onto `--font-sans` / `--heading-font` (see `themeToCssVars`).
 * Vazirmatn is always appended as a fallback so Persian glyphs render when a Latin-only font is
 * chosen.
 */
export const FONT_OPTIONS = ["Inter", "Vazirmatn", "Manrope", "DM Sans", "Playfair Display"] as const;
export type FontOption = (typeof FONT_OPTIONS)[number];

const FONT_VARS: Record<FontOption, string> = {
  Inter: "--font-inter",
  Vazirmatn: "--font-vazirmatn",
  Manrope: "--font-manrope",
  "DM Sans": "--font-dm-sans",
  "Playfair Display": "--font-playfair",
};

function isFontOption(name: string): name is FontOption {
  return (FONT_OPTIONS as readonly string[]).includes(name);
}

/** CSS `font-family` stack for a theme font name; unknown names fall back to Inter. */
export function fontStack(name: string): string {
  const key = isFontOption(name) ? name : "Inter";
  const generic = key === "Playfair Display" ? "serif" : "sans-serif";
  const own = `var(${FONT_VARS[key]})`;
  return key === "Vazirmatn" ? `${own}, ${generic}` : `${own}, var(--font-vazirmatn), ${generic}`;
}
