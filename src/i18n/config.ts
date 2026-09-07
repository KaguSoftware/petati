export const locales = ["en", "tr", "fa"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const rtlLocales: readonly Locale[] = ["fa"];

export const localeNames: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
  fa: "فارسی",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}
