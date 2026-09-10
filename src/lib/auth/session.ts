import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { EffectiveRole, ProfileRow, StoreMemberRow } from "@/lib/db/types";
import { can, type Permission } from "./permissions";

export interface SessionUser {
  id: string;
  email: string | null;
  profile: ProfileRow;
}

/**
 * Current signed-in user (cookie session) or null. Memoised per request.
 * The token is verified locally (`getClaims`, ES256 against the cached JWKS) — no auth-server
 * round trip — so a page costs one database query here (the profile row).
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", claims.sub)
    .maybeSingle<ProfileRow>();
  if (!profile) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null, profile };
});

/** Effective role of the current user on a store, or null if they are not staff there. */
export const getRoleForStore = cache(async (storeId: string): Promise<EffectiveRole | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.profile.platform_role === "owner") return "owner";

  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("store_members")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .maybeSingle<Pick<StoreMemberRow, "role">>();
  return data?.role ?? null;
});

/** Stores where the current user has any admin role. Owner → all stores. */
export const getAdminStoreIds = cache(async (): Promise<string[] | "all"> => {
  const user = await getSessionUser();
  if (!user) return [];
  if (user.profile.platform_role === "owner") return "all";
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("store_members")
    .select("store_id")
    .eq("user_id", user.id)
    .returns<{ store_id: string }[]>();
  return (data ?? []).map((m) => m.store_id);
});

export class ForbiddenError extends Error {
  constructor(permission: Permission) {
    super(`Forbidden: ${permission}`);
    this.name = "ForbiddenError";
  }
}

/** Throws unless the current user holds `permission` on `storeId`. Use in server actions. */
export async function requirePermission(storeId: string, permission: Permission) {
  const role = await getRoleForStore(storeId);
  if (!can(role, permission)) throw new ForbiddenError(permission);
  const user = (await getSessionUser())!;
  return { user, role: role! };
}

/**
 * Page-level guard for areas that need a complete profile: sign-in when anonymous, then the
 * one-time phone screen when the profile has no phone yet.
 */
export async function requireCompleteProfile(locale: string, nextPath: string) {
  const user = await requireUser(locale, nextPath);
  if (!user.profile.phone) redirect(`/${locale}/complete-profile?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** Page-level guard: redirect to sign-in when anonymous. */
export async function requireUser(locale: string, nextPath: string) {
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/sign-in?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/**
 * Platform-level guard (no store scope): only a platform owner holds `permission`.
 * Used by the store-creation module.
 */
export async function requirePlatformPermission(permission: Permission) {
  const user = await getSessionUser();
  const role: EffectiveRole | null = user?.profile.platform_role === "owner" ? "owner" : null;
  if (!user || !can(role, permission)) throw new ForbiddenError(permission);
  return { user, role: role! };
}
