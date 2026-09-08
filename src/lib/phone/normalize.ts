import "server-only";

import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/min";
import { z } from "zod";
import { isCountryCode } from "./countries";

/** Form fields produced by `<PhoneField>`: the country picker + the national number. */
export const phoneFields = {
  phone_country: z
    .string()
    .trim()
    .length(2)
    .transform((s) => s.toUpperCase())
    .refine(isCountryCode, { message: "phoneInvalid" }),
  phone: z.string().trim().min(4, "phoneInvalid").max(24, "phoneInvalid"),
};

export interface NormalizedPhone {
  /** E.164, e.g. +905551234567 */
  e164: string;
  country: string;
}

/**
 * Validate a nationally formatted number for `country` and return E.164.
 * Runs server-side only (the metadata bundle stays out of the client).
 */
export function normalizePhone(national: string, country: string): NormalizedPhone | null {
  const cc = country.toUpperCase();
  if (!isCountryCode(cc)) return null;
  const parsed = parsePhoneNumberFromString(national, cc as CountryCode);
  if (!parsed || !parsed.isValid()) return null;
  return { e164: parsed.number, country: parsed.country ?? cc };
}

/** Display form for stored E.164 numbers ("+90 555 123 45 67"). */
export function formatPhone(e164: string | null | undefined): string {
  if (!e164) return "";
  const parsed = parsePhoneNumberFromString(e164);
  return parsed ? parsed.formatInternational() : e164;
}

/** Split a stored E.164 number back into the picker's country + national digits (for prefilling). */
export function splitPhone(e164: string | null | undefined, fallbackCountry: string): { country: string; national: string } {
  if (!e164) return { country: fallbackCountry, national: "" };
  const parsed = parsePhoneNumberFromString(e164);
  if (!parsed) return { country: fallbackCountry, national: "" };
  return { country: parsed.country ?? fallbackCountry, national: parsed.formatNational().replace(/^0+/, "") };
}
