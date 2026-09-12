/**
 * Latin digits, everywhere, in every locale.
 *
 * `Intl` resolves `fa` to the `arabext` numbering system by default, so formatted output (prices,
 * counts, percentages, dates) came out in Persian digits — `۵۹٫۰۰` — while every number rendered
 * straight into JSX stayed Latin: quantity steppers, `toFixed(1)` ratings, `× 2` line quantities,
 * the `2 / 3` gallery counter. The two sat side by side inside single components.
 *
 * Owner's call (2026-09-12): Latin digits everywhere. They match what people type into inputs and
 * what order numbers and delivery codes already use, so there is one policy and no ambiguity.
 * Pin it at the formatter rather than at ~30 call sites.
 */

const cache = new Map<string, string>();

/** `"fa"` → `"fa-u-nu-latn"`. Falls back to the input if the runtime rejects the locale. */
export function latnLocale(locale: string): string {
  const hit = cache.get(locale);
  if (hit) return hit;
  let out = locale;
  try {
    out = new Intl.Locale(locale, { numberingSystem: "latn" }).toString();
  } catch {
    // Malformed tag — leave it alone rather than throwing inside a render.
  }
  cache.set(locale, out);
  return out;
}

/** Drop-in for `new Intl.NumberFormat(locale, options)` that always yields Latin digits. */
export function numberFormat(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  return new Intl.NumberFormat(latnLocale(locale), options);
}

/** Drop-in for `new Intl.DateTimeFormat(locale, options)` that always yields Latin digits. */
export function dateTimeFormat(locale: string, options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(latnLocale(locale), options);
}

/** One-shot number formatting. */
export function formatNumber(value: number, locale: string, options?: Intl.NumberFormatOptions): string {
  return numberFormat(locale, options).format(value);
}
