/**
 * Fonts a store may pick in the design editor. Every entry is loaded once by the root layout
 * through `next/font/google` and exposed as a CSS variable; the storefront wrapper then maps the
 * theme's choice onto `--font-sans` / `--heading-font` (see `themeToCssVars`).
 *
 * Persian: fonts marked `arabic` carry Arabic-script glyphs and are used for Persian text
 * directly. Latin-only fonts are PAIRED with an Arabic face of matching character (`pair`), so
 * choosing Playfair Display gives Persian headings a serif (Amiri) instead of always Vazirmatn.
 */
export const FONT_OPTIONS = [
  "Inter",
  "Manrope",
  "DM Sans",
  "Playfair Display",
  "Vazirmatn",
  "Noto Sans Arabic",
  "Noto Naskh Arabic",
  "Cairo",
  "Amiri",
  "Markazi Text",
] as const;
export type FontOption = (typeof FONT_OPTIONS)[number];

interface FontMeta {
  /** CSS variable declared by the root layout. */
  cssVar: string;
  generic: "sans-serif" | "serif";
  /** Has Arabic-script glyphs (Persian renders in this font itself). */
  arabic: boolean;
  /** Arabic face used for Persian text when this font is Latin-only. */
  pair?: FontOption;
}

export const FONTS: Record<FontOption, FontMeta> = {
  Inter: { cssVar: "--font-inter", generic: "sans-serif", arabic: false, pair: "Vazirmatn" },
  Manrope: { cssVar: "--font-manrope", generic: "sans-serif", arabic: false, pair: "Noto Sans Arabic" },
  "DM Sans": { cssVar: "--font-dm-sans", generic: "sans-serif", arabic: false, pair: "Cairo" },
  "Playfair Display": { cssVar: "--font-playfair", generic: "serif", arabic: false, pair: "Amiri" },
  Vazirmatn: { cssVar: "--font-vazirmatn", generic: "sans-serif", arabic: true },
  "Noto Sans Arabic": { cssVar: "--font-noto-sans-arabic", generic: "sans-serif", arabic: true },
  "Noto Naskh Arabic": { cssVar: "--font-noto-naskh-arabic", generic: "serif", arabic: true },
  Cairo: { cssVar: "--font-cairo", generic: "sans-serif", arabic: true },
  Amiri: { cssVar: "--font-amiri", generic: "serif", arabic: true },
  "Markazi Text": { cssVar: "--font-markazi", generic: "serif", arabic: true },
};

export function isFontOption(name: string): name is FontOption {
  return (FONT_OPTIONS as readonly string[]).includes(name);
}

/** `font-family` value for the font itself (used by the editor's preview). */
export function fontFamily(name: string): string {
  const key = isFontOption(name) ? name : "Inter";
  return `var(${FONTS[key].cssVar}), ${FONTS[key].generic}`;
}

/**
 * Full storefront stack for a theme font: the font, then its Arabic pair (Persian glyphs), then
 * Vazirmatn as the last-resort Arabic fallback, then the generic family.
 */
export function fontStack(name: string): string {
  const key = isFontOption(name) ? name : "Inter";
  const meta = FONTS[key];
  const chain: FontOption[] = [key];
  if (!meta.arabic && meta.pair) chain.push(meta.pair);
  if (!chain.includes("Vazirmatn")) chain.push("Vazirmatn");
  return chain.map((f) => `var(${FONTS[f].cssVar})`).join(", ") + `, ${meta.generic}`;
}
