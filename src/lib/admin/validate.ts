import { z } from "zod";
import { toMinor } from "@/lib/money";

/**
 * Turn a FormData into a plain object. Keys submitted more than once (checkbox groups) become
 * arrays; everything else stays a string/File so zod schemas read naturally.
 */
export function formToObject(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) {
    const all = formData.getAll(key);
    out[key] = all.length > 1 ? all : all[0];
  }
  return out;
}

export type ParseResult<T> = { data: T; fieldErrors?: undefined } | { data?: undefined; fieldErrors: Record<string, string> };

/** Validate a form against a zod schema; on failure returns `fieldErrors` keyed by the first path segment. */
export function parseForm<S extends z.ZodType>(schema: S, formData: FormData): ParseResult<z.output<S>> {
  const parsed = schema.safeParse(formToObject(formData));
  if (parsed.success) return { data: parsed.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { fieldErrors };
}

/** "" → null so optional text columns store NULL instead of empty strings. */
export const optionalText = (max = 500) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().trim().max(max).nullable());

/** Always an array, even when zero or one value was submitted. */
export const multi = <S extends z.ZodType>(item: S) =>
  z.preprocess((v) => (v == null || v === "" ? [] : Array.isArray(v) ? v : [v]), z.array(item));

/** Decimal string typed by a human ("12.50") → integer minor units for `currency`. */
const parseMoney = (currency: string) => (v: unknown) => {
  if (typeof v !== "string") return v;
  const cleaned = v.trim().replace(/\s/g, "").replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? toMinor(n, currency) : NaN;
};
export const moneyField = (currency: string, { min = 0 } = {}) =>
  z.preprocess((v) => parseMoney(currency)(v) ?? undefined, z.number().int().min(min));
export const optionalMoneyField = (currency: string, { min = 0 } = {}) =>
  z.preprocess(parseMoney(currency), z.number().int().min(min).nullable());

/** Integer typed by a human. */
const parseInt_ = (v: unknown) => {
  if (typeof v !== "string") return v;
  const t = v.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
};
export const intField = ({ min = 0, max = 1_000_000_000 } = {}) => z.preprocess((v) => parseInt_(v) ?? undefined, z.number().int().min(min).max(max));
export const optionalIntField = ({ min = 0, max = 1_000_000_000 } = {}) => z.preprocess(parseInt_, z.number().int().min(min).max(max).nullable());

/** Checkbox / switch: present ("on" | "true") → true, absent → false. */
export const boolField = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

/** A hidden input carrying JSON for nested editors. */
export const jsonField = <S extends z.ZodType>(schema: S) =>
  z.preprocess((v) => {
    if (typeof v !== "string") return v;
    try {
      return JSON.parse(v);
    } catch {
      return undefined;
    }
  }, schema);

/** Lenient UUID: Zod 4's z.uuid() rejects ids whose version nibble is not 1-8 (our seeded fixtures). */
export const uuidField = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "invalid");

/** ISO date "YYYY-MM-DD". */
export const dateField = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.iso.date());
export const optionalDateField = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.iso.date().nullable());
