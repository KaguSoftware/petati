"use server";

import { refresh, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isLocale } from "@/i18n/config";
import { ADMIN_STORE_COOKIE } from "@/lib/admin/constants";
import { actionError } from "@/lib/admin/guard";
import type { ActionState } from "@/lib/admin/types";
import { uuidField } from "@/lib/admin/validate";
import type { StoreDomainRow } from "@/lib/db/types";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { RESERVED_SUBDOMAINS } from "@/lib/tenant/resolve";
import { storeCacheTag } from "@/lib/tenant/store";
import { DEFAULT_THEME } from "@/lib/theme/types";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_SHIPPING_RATES, LOGO_MAX_BYTES, LOGO_TYPES } from "./defaults";
import { requireMultiStore } from "./guard";
import { createStoreSchema, HOSTNAME_RE, hostnameConflictsWithRoot, issuesToFieldErrors, SLUG_RE } from "./schema";
import type { AvailabilityResult } from "./types";

const BUCKET = "store-media";

type Db = ReturnType<typeof createSupabaseAdminClient>;

function isUnique(err: unknown) {
  return !!err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505";
}

/** Live availability check for the wizard's slug field. */
export async function checkStoreSlugAction(slug: string): Promise<AvailabilityResult> {
  await requireMultiStore("store.create");
  const s = String(slug ?? "").trim().toLowerCase();
  if (s.length < 3 || s.length > 40 || !SLUG_RE.test(s)) return { error: "invalid" };
  if (RESERVED_SUBDOMAINS.has(s)) return { error: "reserved" };
  const db = createSupabaseAdminClient();
  const { data } = await db.from("stores").select("id").eq("slug", s).maybeSingle<{ id: string }>();
  return data ? { error: "taken" } : { ok: true };
}

/** Live availability check for a custom hostname. */
export async function checkHostnameAction(hostname: string): Promise<AvailabilityResult> {
  await requireMultiStore("store.domains");
  const h = String(hostname ?? "").trim().toLowerCase();
  if (!HOSTNAME_RE.test(h)) return { error: "invalid" };
  if (hostnameConflictsWithRoot(h, env.rootDomain())) return { error: "rootDomain" };
  const db = createSupabaseAdminClient();
  const { data } = await db.from("store_domains").select("id").eq("hostname", h).maybeSingle<{ id: string }>();
  return data ? { error: "taken" } : { ok: true };
}

async function removeStorageFolder(db: Db, storeId: string) {
  // Best effort, two levels deep (<id>/<folder>/<file>); a failure here must not block the delete.
  try {
    const paths: string[] = [];
    const { data: top } = await db.storage.from(BUCKET).list(storeId, { limit: 1000 });
    for (const entry of top ?? []) {
      if (entry.id) paths.push(`${storeId}/${entry.name}`);
      else {
        const { data: inner } = await db.storage.from(BUCKET).list(`${storeId}/${entry.name}`, { limit: 1000 });
        for (const f of inner ?? []) if (f.id) paths.push(`${storeId}/${entry.name}/${f.name}`);
      }
    }
    if (paths.length) await db.storage.from(BUCKET).remove(paths);
  } catch {
    // ignore
  }
}

/**
 * Creates a store from the wizard payload (`payload` JSON + optional `logo` File).
 * Owner-only.
 */
export async function createStoreAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const localeRaw = String(formData.get("locale") ?? "en");
  const locale = isLocale(localeRaw) ? localeRaw : "en";
  let createdSlug: string | null = null;

  try {
    const { user } = await requireMultiStore("store.create");

    let raw: unknown;
    try {
      raw = JSON.parse(String(formData.get("payload") ?? ""));
    } catch {
      return { error: "invalid", fieldErrors: { _: "invalid" } };
    }
    const parsed = createStoreSchema.safeParse(raw);
    if (!parsed.success) return { error: "invalid", fieldErrors: issuesToFieldErrors(parsed.error.issues) };
    const p = parsed.data;

    if (p.customDomain && hostnameConflictsWithRoot(p.customDomain, env.rootDomain())) {
      return { error: "invalid", fieldErrors: { customDomain: "rootDomain" } };
    }

    const logo = formData.get("logo");
    const logoFile = logo instanceof File && logo.size > 0 ? logo : null;
    if (logoFile) {
      if (logoFile.size > LOGO_MAX_BYTES) return { error: "invalid", fieldErrors: { logo: "logoTooLarge" } };
      if (!LOGO_TYPES[logoFile.type]) return { error: "invalid", fieldErrors: { logo: "logoType" } };
    }

    const db = createSupabaseAdminClient();
    const theme = { sections: p.sections, colors: p.colors, fonts: DEFAULT_THEME.fonts, radius: p.radius, announcement: p.announcement };
    const { data: store, error: insertErr } = await db
      .from("stores")
      .insert({
        slug: p.slug,
        name: p.name,
        tagline: p.tagline || null,
        currency: p.currency,
        default_locale: p.defaultLocale,
        enabled_locales: p.enabledLocales,
        contact_email: p.contactEmail || null,
        contact_phone: p.contactPhone || null,
        email_from: p.emailFrom || null,
        tax_rate_bp: p.taxRateBp,
        prices_include_tax: p.pricesIncludeTax,
        low_stock_threshold: p.lowStockThreshold,
        theme,
        settings: {},
        is_active: true,
        created_by: user.id,
      })
      .select("id, slug")
      .single<{ id: string; slug: string }>();
    if (insertErr || !store) {
      if (isUnique(insertErr)) return { error: "invalid", fieldErrors: { slug: "taken" } };
      throw insertErr ?? new Error("insert failed");
    }

    const rollback = async () => {
      await db.from("stores").delete().eq("id", store.id);
    };

    if (p.customDomain) {
      const { error: domErr } = await db.from("store_domains").insert({ store_id: store.id, hostname: p.customDomain, is_primary: true });
      if (domErr) {
        await rollback();
        if (isUnique(domErr)) return { error: "invalid", fieldErrors: { customDomain: "taken" } };
        throw domErr;
      }
    }

    const { error: rateErr } = await db.from("shipping_rates").insert(DEFAULT_SHIPPING_RATES.map((r) => ({ ...r, store_id: store.id })));
    if (rateErr) {
      await rollback();
      throw rateErr;
    }
    const { error: catErr } = await db.from("expense_categories").insert(DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, store_id: store.id })));
    if (catErr) {
      await rollback();
      throw catErr;
    }

    if (logoFile) {
      const ext = LOGO_TYPES[logoFile.type];
      const path = `${store.id}/branding/logo-${Date.now()}.${ext}`;
      const bytes = await logoFile.arrayBuffer();
      const { error: upErr } = await db.storage.from(BUCKET).upload(path, bytes, { contentType: logoFile.type, upsert: false });
      if (upErr) {
        await rollback();
        return { error: "logoUpload" };
      }
      const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
      await db.from("stores").update({ logo_url: pub.publicUrl }).eq("id", store.id);
    }

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_STORE_COOKIE, store.id, { path: "/", sameSite: "lax", httpOnly: true });

    updateTag(storeCacheTag(store.slug));
    updateTag("stores");
    if (p.customDomain) updateTag(`domain:${p.customDomain}`);
    createdSlug = store.slug;
  } catch (err) {
    return { error: actionError(err) };
  }

  redirect(`/${locale}/admin/stores?created=${encodeURIComponent(createdSlug ?? "")}`);
}

async function loadStore(db: Db, storeId: string) {
  const { data } = await db.from("stores").select("id, slug, is_active").eq("id", storeId).maybeSingle<{ id: string; slug: string; is_active: boolean }>();
  return data ?? null;
}

/** Activate / deactivate a store. The default store is never touched. */
export async function setStoreActiveAction(storeId: string, active: boolean): Promise<ActionState> {
  try {
    await requireMultiStore("store.settings");
    const id = uuidField.parse(storeId);
    const on = z.boolean().parse(active);
    const db = createSupabaseAdminClient();
    const store = await loadStore(db, id);
    if (!store) return { error: "notFound" };
    if (store.slug === env.defaultStoreSlug()) return { error: "defaultStore" };
    const { error } = await db.from("stores").update({ is_active: on }).eq("id", id);
    if (error) throw error;
    updateTag(storeCacheTag(store.slug));
    updateTag("stores");
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}

/** Permanently deletes a store (FKs cascade) after the owner typed its slug. */
export async function deleteStoreAction(storeId: string, confirmSlug: string): Promise<ActionState> {
  try {
    await requireMultiStore("store.delete");
    const id = uuidField.parse(storeId);
    const db = createSupabaseAdminClient();
    const store = await loadStore(db, id);
    if (!store) return { error: "notFound" };
    if (store.slug === env.defaultStoreSlug()) return { error: "defaultStore" };
    if (String(confirmSlug ?? "").trim().toLowerCase() !== store.slug.toLowerCase()) return { error: "slugMismatch" };

    const { data: domains } = await db.from("store_domains").select("hostname").eq("store_id", id).returns<Pick<StoreDomainRow, "hostname">[]>();
    await removeStorageFolder(db, id);
    const { error } = await db.from("stores").delete().eq("id", id);
    if (error) throw error;

    const cookieStore = await cookies();
    if (cookieStore.get(ADMIN_STORE_COOKIE)?.value === id) cookieStore.delete(ADMIN_STORE_COOKIE);

    updateTag(storeCacheTag(store.slug));
    updateTag("stores");
    for (const d of domains ?? []) updateTag(`domain:${d.hostname}`);
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}
