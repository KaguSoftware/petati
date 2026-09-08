"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { actionError } from "@/lib/admin/guard";
import type { ActionState } from "@/lib/admin/types";
import { boolField, parseForm, uuidField } from "@/lib/admin/validate";
import type { StoreDomainRow } from "@/lib/db/types";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { storeCacheTag } from "@/lib/tenant/store";
import { requireMultiStore } from "./guard";
import { HOSTNAME_RE, hostnameConflictsWithRoot } from "./schema";

type Db = ReturnType<typeof createSupabaseAdminClient>;

function isUnique(err: unknown) {
  return !!err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505";
}

async function storeSlug(db: Db, storeId: string) {
  const { data } = await db.from("stores").select("slug").eq("id", storeId).maybeSingle<{ slug: string }>();
  return data?.slug ?? null;
}

function invalidate(slug: string, hostnames: string[]) {
  updateTag(storeCacheTag(slug));
  updateTag("stores");
  for (const h of hostnames) updateTag(`domain:${h}`);
}

/**
 * Attach a custom hostname to a store. `verified_at` stays null: DNS verification is manual.
 * SCOPE(multi-store, unpaid): GROWS LATER → automatic DNS/TLS verification on the host platform.
 */
export async function addStoreDomainAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(
    z.object({
      storeId: uuidField,
      hostname: z.string().trim().toLowerCase().max(253, "tooLong").regex(HOSTNAME_RE, "invalid"),
      makePrimary: boolField,
    }),
    formData,
  );
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, hostname, makePrimary } = parsed.data;
  if (hostnameConflictsWithRoot(hostname, env.rootDomain())) return { error: "invalid", fieldErrors: { hostname: "rootDomain" } };
  try {
    await requireMultiStore("store.domains");
    const db = createSupabaseAdminClient();
    const slug = await storeSlug(db, storeId);
    if (!slug) return { error: "notFound" };
    const { count } = await db.from("store_domains").select("id", { count: "exact", head: true }).eq("store_id", storeId);
    const primary = makePrimary || (count ?? 0) === 0;
    if (primary) await db.from("store_domains").update({ is_primary: false }).eq("store_id", storeId);
    const { data, error } = await db.from("store_domains").insert({ store_id: storeId, hostname, is_primary: primary }).select("id").single<{ id: string }>();
    if (error) {
      if (isUnique(error)) return { error: "invalid", fieldErrors: { hostname: "taken" } };
      throw error;
    }
    invalidate(slug, [hostname]);
    refresh();
    return { ok: true, id: data.id };
  } catch (err) {
    return { error: actionError(err) };
  }
}

export async function removeStoreDomainAction(domainId: string): Promise<ActionState> {
  try {
    await requireMultiStore("store.domains");
    const id = uuidField.parse(domainId);
    const db = createSupabaseAdminClient();
    const { data: row } = await db.from("store_domains").select("*").eq("id", id).maybeSingle<StoreDomainRow>();
    if (!row) return { error: "notFound" };
    const slug = await storeSlug(db, row.store_id);
    const { error } = await db.from("store_domains").delete().eq("id", id);
    if (error) throw error;
    if (row.is_primary) {
      // Promote the oldest remaining hostname so the store keeps a primary domain.
      const { data: next } = await db.from("store_domains").select("id").eq("store_id", row.store_id).order("created_at").limit(1).maybeSingle<{ id: string }>();
      if (next) await db.from("store_domains").update({ is_primary: true }).eq("id", next.id);
    }
    if (slug) invalidate(slug, [row.hostname]);
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}

export async function setPrimaryDomainAction(domainId: string): Promise<ActionState> {
  try {
    await requireMultiStore("store.domains");
    const id = uuidField.parse(domainId);
    const db = createSupabaseAdminClient();
    const { data: row } = await db.from("store_domains").select("*").eq("id", id).maybeSingle<StoreDomainRow>();
    if (!row) return { error: "notFound" };
    const slug = await storeSlug(db, row.store_id);
    const { data: siblings } = await db.from("store_domains").select("hostname").eq("store_id", row.store_id).returns<Pick<StoreDomainRow, "hostname">[]>();
    await db.from("store_domains").update({ is_primary: false }).eq("store_id", row.store_id);
    const { error } = await db.from("store_domains").update({ is_primary: true }).eq("id", id);
    if (error) throw error;
    if (slug) invalidate(slug, (siblings ?? []).map((s) => s.hostname));
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}
