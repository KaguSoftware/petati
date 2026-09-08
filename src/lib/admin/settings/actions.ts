"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { locales, type Locale } from "@/i18n/config";
import { actionError, adminMutation } from "@/lib/admin/guard";
import type { ActionState } from "@/lib/admin/types";
import { boolField, intField, jsonField, moneyField, multi, optionalIntField, optionalMoneyField, optionalText, parseForm, uuidField } from "@/lib/admin/validate";
import { catalogTag } from "@/lib/catalog/queries";
import type { Translated } from "@/lib/db/types";
import { storeCacheTag } from "@/lib/tenant/store";
import { CONTENT_PAGES, CURRENCIES, EMAIL_FROM_RE } from "./constants";

const localeEnum = z.enum(locales);

type Db = Awaited<ReturnType<typeof adminMutation>>["db"];

interface StoreLite {
  id: string;
  slug: string;
  currency: string;
  enabled_locales: Locale[];
  settings: Record<string, unknown> | null;
}

async function loadStore(db: Db, storeId: string) {
  const { data } = await db.from("stores").select("id, slug, currency, enabled_locales, settings").eq("id", storeId).maybeSingle<StoreLite>();
  return data ?? null;
}

/** The storefront caches the store row (tenant lookup); every settings save must drop it. */
function invalidateStore(slug: string) {
  updateTag(storeCacheTag(slug));
  updateTag("stores");
  refresh();
}

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const generalSchema = z
  .object({
    storeId: uuidField,
    name: z.string().trim().min(1, "required").max(120, "invalid"),
    tagline: optionalText(200),
    contact_email: z.preprocess(emptyToNull, z.string().trim().email("invalid").max(200, "invalid").nullable()),
    contact_phone: optionalText(40),
    email_from: z.preprocess(emptyToNull, z.string().trim().max(200, "invalid").regex(EMAIL_FROM_RE, "invalid").nullable()),
    timezone: z.string().refine((tz) => tz === "UTC" || Intl.supportedValuesOf("timeZone").includes(tz), "invalid"),
    default_locale: localeEnum,
    enabled_locales: multi(localeEnum).pipe(z.array(localeEnum).min(1, "required")),
  })
  .refine((d) => d.enabled_locales.includes(d.default_locale), { path: ["enabled_locales"], message: "defaultLocaleMustBeEnabled" });

export async function updateStoreGeneralAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(generalSchema, formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, ...fields } = parsed.data;
  try {
    const { db } = await adminMutation(storeId, "store.settings");
    const store = await loadStore(db, storeId);
    if (!store) return { error: "notFound" };
    // Keep the locale order stable (en, tr, fa) regardless of checkbox order.
    const enabled_locales = locales.filter((l) => fields.enabled_locales.includes(l));
    const { error } = await db.from("stores").update({ ...fields, enabled_locales }).eq("id", storeId);
    if (error) throw error;
    invalidateStore(store.slug);
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}

/** Percent typed by a human ("18" or "18.5") → basis points (1850). */
const percentToBp = z.preprocess(
  (v) => {
    if (typeof v !== "string") return v;
    const t = v.trim().replace(",", ".");
    if (t === "") return 0;
    const n = Number(t);
    return Number.isFinite(n) ? Math.round(n * 100) : NaN;
  },
  z.number().int().min(0, "invalid").max(10_000, "invalid"),
);

const commerceSchema = z.object({
  storeId: uuidField,
  currency: z.enum(CURRENCIES),
  tax_percent: percentToBp,
  prices_include_tax: boolField,
  low_stock_threshold: intField({ min: 0, max: 100_000 }),
});

export async function updateStoreCommerceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(commerceSchema, formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, currency, tax_percent, prices_include_tax, low_stock_threshold } = parsed.data;
  try {
    const { db } = await adminMutation(storeId, "store.settings");
    const store = await loadStore(db, storeId);
    if (!store) return { error: "notFound" };
    const { error } = await db.from("stores").update({ currency, tax_rate_bp: tax_percent, prices_include_tax, low_stock_threshold }).eq("id", storeId);
    if (error) throw error;
    invalidateStore(store.slug);
    updateTag(catalogTag(storeId));
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}

/**
 * Content pages: `settings.pages.{privacy|terms|about}.{locale}` plain text, merged into the
 * stores.settings jsonb. SCOPE(content-pages): plain text (the storefront renders it with
 * `whitespace-pre-line`). GROWS LATER → rich text editor.
 */
export async function updatePagesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(z.object({ storeId: uuidField }), formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId } = parsed.data;
  const pages: Record<string, Record<string, string>> = {};
  const fieldErrors: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    const m = /^pages\.(privacy|terms|about)\.(en|tr|fa)$/.exec(key);
    if (!m || typeof value !== "string") continue;
    if (value.length > 20_000) fieldErrors[key] = "invalid";
    (pages[m[1]] ??= {})[m[2]] = value.trim();
  }
  if (Object.keys(fieldErrors).length) return { error: "invalid", fieldErrors };
  try {
    const { db } = await adminMutation(storeId, "store.settings");
    const store = await loadStore(db, storeId);
    if (!store) return { error: "notFound" };
    const settings = store.settings ?? {};
    const existing = (settings.pages ?? {}) as Record<string, Record<string, string>>;
    const merged: Record<string, Record<string, string>> = { ...existing };
    for (const page of CONTENT_PAGES) merged[page] = { ...(existing[page] ?? {}), ...(pages[page] ?? {}) };
    const { error } = await db.from("stores").update({ settings: { ...settings, pages: merged } }).eq("id", storeId);
    if (error) throw error;
    invalidateStore(store.slug);
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}

const countryCode = z.string().regex(/^[A-Z]{2}$/, "invalid");

function shippingSchema(currency: string) {
  return z
    .object({
      storeId: uuidField,
      rateId: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), uuidField.optional()),
      name_en: optionalText(120),
      name_tr: optionalText(120),
      name_fa: optionalText(120),
      rate: moneyField(currency),
      free_over: optionalMoneyField(currency, { min: 1 }),
      countries: jsonField(z.array(countryCode).max(250)),
      min_days: optionalIntField({ min: 0, max: 365 }),
      max_days: optionalIntField({ min: 0, max: 365 }),
      is_active: boolField,
      sort_order: intField({ min: 0, max: 10_000 }),
    })
    .refine((d) => d.min_days == null || d.max_days == null || d.max_days >= d.min_days, { path: ["max_days"], message: "maxBeforeMin" });
}

/** Create or update a shipping rate. Invalidates the storefront's cached rates + catalog. */
export async function saveShippingRateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const pre = parseForm(z.object({ storeId: uuidField }), formData);
  if (!pre.data) return { error: "invalid", fieldErrors: pre.fieldErrors };
  const { storeId } = pre.data;
  try {
    const { db } = await adminMutation(storeId, "store.settings");
    const store = await loadStore(db, storeId);
    if (!store) return { error: "notFound" };
    const parsed = parseForm(shippingSchema(store.currency), formData);
    if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
    const d = parsed.data;
    const name: Translated = {};
    for (const l of locales) {
      const v = d[`name_${l}`];
      if (v) name[l] = v;
    }
    if (Object.keys(name).length === 0) return { error: "invalid", fieldErrors: { [`name_${store.enabled_locales[0] ?? "en"}`]: "required" } };
    const row = {
      store_id: storeId,
      name,
      rate: d.rate,
      free_over: d.free_over,
      countries: d.countries.length ? Array.from(new Set(d.countries)) : null,
      min_days: d.min_days,
      max_days: d.max_days,
      is_active: d.is_active,
      sort_order: d.sort_order,
    };
    let id = d.rateId;
    if (id) {
      const { data, error } = await db.from("shipping_rates").update(row).eq("store_id", storeId).eq("id", id).select("id").maybeSingle<{ id: string }>();
      if (error) throw error;
      if (!data) return { error: "notFound" };
    } else {
      const { data, error } = await db.from("shipping_rates").insert(row).select("id").single<{ id: string }>();
      if (error) throw error;
      id = data.id;
    }
    updateTag(`shipping:${storeId}`);
    updateTag(catalogTag(storeId));
    refresh();
    return { ok: true, id };
  } catch (err) {
    return { error: actionError(err) };
  }
}

export async function deleteShippingRateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(z.object({ storeId: uuidField, rateId: uuidField }), formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, rateId } = parsed.data;
  try {
    const { db } = await adminMutation(storeId, "store.settings");
    const { error } = await db.from("shipping_rates").delete().eq("store_id", storeId).eq("id", rateId);
    if (error) throw error;
    updateTag(`shipping:${storeId}`);
    updateTag(catalogTag(storeId));
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}
