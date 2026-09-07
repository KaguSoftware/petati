import type { Locale } from "@/i18n/config";
import type { Translated } from "@/lib/db/types";

/** Pick a translated string with fallback: requested → store default → first available. */
export function t(value: Translated | null | undefined, locale: Locale, fallback: Locale = "en"): string {
  if (!value) return "";
  return value[locale] ?? value[fallback] ?? Object.values(value).find(Boolean) ?? "";
}
