"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { actionError, adminMutation } from "@/lib/admin/guard";
import type { ActionState } from "@/lib/admin/types";
import { jsonField, optionalText, parseForm, uuidField } from "@/lib/admin/validate";
import { env } from "@/lib/env";
import { storeCacheTag } from "@/lib/tenant/store";
import { parseTheme } from "@/lib/theme/types";
import { themePatchSchema } from "./constants";

/** Merge a partial theme into the stored one. The storefront caches the store row, so its tags are refreshed. */
export async function saveThemeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(z.object({ storeId: uuidField, theme: jsonField(themePatchSchema) }), formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, theme: patch } = parsed.data;
  try {
    const { db } = await adminMutation(storeId, "store.design");
    const { data: store } = await db.from("stores").select("slug, theme").eq("id", storeId).maybeSingle<{ slug: string; theme: unknown }>();
    if (!store) return { error: "notFound" };
    const current = parseTheme(store.theme);
    const next = parseTheme({
      sections: { ...current.sections, ...(patch.sections ?? {}) },
      colors: { ...current.colors, ...(patch.colors ?? {}) },
      fonts: { ...current.fonts, ...(patch.fonts ?? {}) },
      radius: patch.radius ?? current.radius,
      announcement: patch.announcement ?? current.announcement,
    });
    const { error } = await db.from("stores").update({ theme: next }).eq("id", storeId);
    if (error) throw error;
    updateTag(storeCacheTag(store.slug));
    updateTag("stores");
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}

/** Set (or clear) the logo / favicon URL. Only accepts public URLs inside this store's media folder. */
export async function setBrandingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(z.object({ storeId: uuidField, kind: z.enum(["logo", "favicon"]), url: optionalText(1000) }), formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, kind, url } = parsed.data;
  const prefix = `${env.supabaseUrl()}/storage/v1/object/public/store-media/${storeId}/`;
  if (url && !url.startsWith(prefix)) return { error: "invalid", fieldErrors: { url: "invalid" } };
  try {
    const { db } = await adminMutation(storeId, "store.design");
    const { data: store } = await db.from("stores").select("slug").eq("id", storeId).maybeSingle<{ slug: string }>();
    if (!store) return { error: "notFound" };
    const { error } = await db
      .from("stores")
      .update(kind === "logo" ? { logo_url: url } : { favicon_url: url })
      .eq("id", storeId);
    if (error) throw error;
    updateTag(storeCacheTag(store.slug));
    updateTag("stores");
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}
