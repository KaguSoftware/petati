/** Amounts are integers in minor units (kuruş, cents). Format only at the edge. */
const ZERO_DECIMAL = new Set(["JPY", "KRW", "IRR", "IQD"]);

export function minorUnitsPerMajor(currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? 1 : 100;
}

export function formatMoney(amountMinor: number, currency: string, locale: string): string {
  const divisor = minorUnitsPerMajor(currency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: divisor === 1 ? 0 : 2,
    maximumFractionDigits: divisor === 1 ? 0 : 2,
  }).format(amountMinor / divisor);
}

export function toMinor(amountMajor: number, currency: string): number {
  return Math.round(amountMajor * minorUnitsPerMajor(currency));
}

export function toMajor(amountMinor: number, currency: string): number {
  return amountMinor / minorUnitsPerMajor(currency);
}
