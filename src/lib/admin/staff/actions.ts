"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { locales } from "@/i18n/config";
import { actionError, adminMutation } from "@/lib/admin/guard";
import type { ActionState } from "@/lib/admin/types";
import { parseForm, uuidField } from "@/lib/admin/validate";
import { env } from "@/lib/env";
import { STORE_ROLES } from "./types";

const roleEnum = z.enum(STORE_ROLES);

/**
 * Invite by email. Existing account → membership only; unknown email → Supabase invite mail
 * (the DB trigger creates the profile) then membership. Managers may grant staff|manager only,
 * which is the whole `store_role` enum, so the enum is the guard.
 */
export async function inviteStaffAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(
    z.object({
      storeId: uuidField,
      email: z.string().trim().toLowerCase().email("invalid").max(200, "invalid"),
      role: roleEnum,
      locale: z.enum(locales).default("en"),
    }),
    formData,
  );
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, email, role, locale } = parsed.data;
  try {
    const { db, user } = await adminMutation(storeId, "staff.manage");
    const { data: profile } = await db.from("profiles").select("id, platform_role").eq("email", email).maybeSingle<{ id: string; platform_role: string | null }>();
    if (profile?.platform_role === "owner") return { error: "isOwner" };
    let userId = profile?.id ?? null;
    if (!userId) {
      const meta = { invited_to_store: storeId };
      const invited = await db.auth.admin.inviteUserByEmail(email, { redirectTo: `${env.appUrl()}/auth/callback?next=/${locale}/admin`, data: meta });
      if (invited.data.user) userId = invited.data.user.id;
      else {
        // The invite mail could not be sent (e.g. Supabase's built-in SMTP only delivers to project
        // members). Pre-create the account so the membership exists: the person can then sign in
        // with Google on that address or use "Forgot password" once mail delivery is configured.
        console.error("[staff] inviteUserByEmail failed, creating the account without mail:", invited.error?.message);
        const created = await db.auth.admin.createUser({ email, email_confirm: true, user_metadata: meta });
        if (created.error || !created.data.user) return { error: "inviteFailed" };
        userId = created.data.user.id;
      }
      // The auth trigger inserts the profile synchronously; guard the FK anyway.
      const { data: created } = await db.from("profiles").select("id").eq("id", userId).maybeSingle<{ id: string }>();
      if (!created) await db.from("profiles").insert({ id: userId, email });
    }
    const { error } = await db.from("store_members").insert({ store_id: storeId, user_id: userId, role, invited_by: user.id });
    if (error) {
      if (error.code === "23505") return { error: "alreadyMember" };
      throw error;
    }
    refresh();
    return { ok: true, id: userId };
  } catch (err) {
    return { error: actionError(err) };
  }
}

const memberSchema = z.object({ storeId: uuidField, userId: uuidField });

export async function changeRoleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(memberSchema.extend({ role: roleEnum }), formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, userId, role } = parsed.data;
  try {
    const { db, user, role: actorRole } = await adminMutation(storeId, "staff.manage");
    if (actorRole !== "owner" && userId === user.id) return { error: "self" };
    const { data, error } = await db.from("store_members").update({ role }).eq("store_id", storeId).eq("user_id", userId).select("user_id").maybeSingle<{ user_id: string }>();
    if (error) throw error;
    if (!data) return { error: "notFound" };
    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}

/**
 * Remove a member. When the account was invited by us and never signed in anywhere (no other
 * membership, not an owner), the auth user is deleted too so the invite is fully revoked.
 */
export async function removeStaffAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(memberSchema, formData);
  if (!parsed.data) return { error: "invalid", fieldErrors: parsed.fieldErrors };
  const { storeId, userId } = parsed.data;
  try {
    const { db, user, role: actorRole } = await adminMutation(storeId, "staff.manage");
    if (actorRole !== "owner" && userId === user.id) return { error: "self" };
    const { data, error } = await db.from("store_members").delete().eq("store_id", storeId).eq("user_id", userId).select("user_id").maybeSingle<{ user_id: string }>();
    if (error) throw error;
    if (!data) return { error: "notFound" };

    const [{ data: profile }, { count }, { data: auth }] = await Promise.all([
      db.from("profiles").select("platform_role").eq("id", userId).maybeSingle<{ platform_role: string | null }>(),
      db.from("store_members").select("user_id", { count: "exact", head: true }).eq("user_id", userId),
      db.auth.admin.getUserById(userId),
    ]);
    const invitedByUs = !!auth?.user && (!!auth.user.invited_at || !!(auth.user.user_metadata as { invited_to_store?: string } | null)?.invited_to_store);
    const pendingInvite = invitedByUs && !auth?.user?.last_sign_in_at;
    if (pendingInvite && !profile?.platform_role && (count ?? 0) === 0) await db.auth.admin.deleteUser(userId);

    refresh();
    return { ok: true };
  } catch (err) {
    return { error: actionError(err) };
  }
}
