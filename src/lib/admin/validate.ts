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
export const moneyField = (currency: string, { min = 0, optional = false } = {}) =>
  z.preprocess(
    (v) => {
      if (typeof v !== "string") return v;
      const cleaned = v.trim().replace(/\s/g, "").replace(",", ".");
      if (cleaned === "") return optional ? null : undefined;
      const n = Number(cleaned);
      return Number.isFinite(n) ? toMinor(n, currency) : NaN;
    },
    optional ? z.number().int().min(min).nullable() : z.number().int().min(min),
  );

/** Integer typed by a human; "" → null when optional. */
export const intField = ({ min = 0, max = 1_000_000_000, optional = false } = {}) =>
  z.preprocess(
    (v) => {
      if (typeof v !== "string") return v;
      const t = v.trim();
      if (t === "") return optional ? null : undefined;
      const n = Number(t);
      return Number.isFinite(n) ? Math.trunc(n) : NaN;
    },
    optional ? z.number().int().min(min).max(max).nullable() : z.number().int().min(min).max(max),
  );

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

export const uuidField = z.uuid();

/** ISO date "YYYY-MM-DD" or "" → null. */
export const dateField = ({ optional = false } = {}) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? (optional ? null : undefined) : v),
    optional ? z.iso.date().nullable() : z.iso.date(),
  );
