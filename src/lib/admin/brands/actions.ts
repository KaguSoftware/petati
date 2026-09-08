"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { actionError, adminMutation } from "@/lib/admin/guard";
import type { ActionState } from "@/lib/admin/types";
import { boolField, intField, parseForm, uuidField } from "@/lib/admin/validate";
import { catalogTag } from "@/lib/catalog/queries";

type Db = Awaited<ReturnType<typeof adminMutation>>["db"];

const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "required")
  .max(120)
  .regex(/^[a-z0-9-]+$/, "slugFormat");
const optionalSlugField = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), slugField.optional());
const optionalUrlField = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.url().max(1000).nullable());

const TR_MAP: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", İ: "i" };
/** Server-side twin of the form's `slugify` (used when the slug field is left empty). */
function slugify(input: string): string {
  return input
    .replace(/[çğıöşüİ]/g, (c) => TR_MAP[c] ?? c)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function isUnique(err: unknown) {
  return !!err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505";
}

async function assertBrandInStore(db: Db, id: string, storeId: string) {
  const { data } = await db.from("brands").select("store_id").eq("id", id).maybeSingle<{ store_id: string }>();
  if (!data || data.store_id !== storeId) return false;
  return true;
}

const brandRef = z.object({ storeId: uuidField, brandId: uuidField });

export async function saveBrandAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(
    z.object({
      storeId: uuidField,
      brandId: z.preprocess((v) => (v === "" ? undefined : v), uuidField.optional()),
      name: z.string().trim().min(1, "required").max(120),
      slug: optionalSlugField,
      logo_url: optionalUrlField,
      sort_order: intField({ max: 10_000 }),
      is_active: boolField,
    }),
    formData,
  );
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, brandId, name, logo_url, sort_order, is_active } = parsed.data;
  const slug = parsed.data.slug ?? slugify(name);
  if (!slug) return { error: "invalid", fieldErrors: { slug: "required" } };
  try {
    const { db } = await adminMutation(storeId, "products.write");
    const patch = { name, slug, logo_url, sort_order, is_active };
    let id = brandId ?? null;
    if (id) {
      if (!(await assertBrandInStore(db, id, storeId))) return { error: "notFound" };
      const { error } = await db.from("brands").update(patch).eq("id", id).eq("store_id", storeId);
      if (error) throw error;
    } else {
      const { data, error } = await db.from("brands").insert({ ...patch, store_id: storeId }).select("id").single<{ id: string }>();
      if (error) throw error;
      id = data.id;
    }
    updateTag(catalogTag(storeId));
    refresh();
    return { ok: true, id };
  } catch (err) {
    if (isUnique(err)) return { error: "invalid", fieldErrors: { slug: "unique" } };
    return { error: actionError(err) };
  }
}

/** Products keep their rows; the FK sets `products.brand_id` to null. */
export async function deleteBrandAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(brandRef, formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, brandId } = parsed.data;
  try {
    const { db } = await adminMutation(storeId, "products.write");
    if (!(await assertBrandInStore(db, brandId, storeId))) return { error: "notFound" };
    const { error } = await db.from("brands").delete().eq("id", brandId).eq("store_id", storeId);
    if (error) throw error;
    updateTag(catalogTag(storeId));
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}

export async function toggleBrandActiveAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(brandRef.extend({ is_active: boolField }), formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, brandId, is_active } = parsed.data;
  try {
    const { db } = await adminMutation(storeId, "products.write");
    if (!(await assertBrandInStore(db, brandId, storeId))) return { error: "notFound" };
    const { error } = await db.from("brands").update({ is_active }).eq("id", brandId).eq("store_id", storeId);
    if (error) throw error;
    updateTag(catalogTag(storeId));
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}
