import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StoreRole } from "@/lib/db/types";
import type { OwnerProfile, StaffMember } from "./types";

interface ProfileLite {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface MemberJoin {
  user_id: string;
  role: StoreRole;
  created_at: string;
  profiles: ProfileLite | null;
}

/** Members of one store with their profiles, oldest first. */
export async function listStaff(storeId: string): Promise<StaffMember[]> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("store_members")
    // store_members has two FKs to profiles (user_id, invited_by): name the one to embed.
    .select("user_id, role, created_at, profiles!store_members_user_id_fkey(id, email, full_name, avatar_url)")
    .eq("store_id", storeId)
    .order("created_at")
    .returns<MemberJoin[]>();
  if (error) throw error;
  return (data ?? []).map((m) => ({
    userId: m.user_id,
    role: m.role,
    joinedAt: m.created_at,
    email: m.profiles?.email ?? null,
    fullName: m.profiles?.full_name ?? null,
    avatarUrl: m.profiles?.avatar_url ?? null,
  }));
}

/** Platform owners. Only shown to owners (see the staff page). */
export async function listOwners(): Promise<OwnerProfile[]> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from("profiles").select("id, email, full_name, avatar_url").eq("platform_role", "owner").order("created_at").returns<ProfileLite[]>();
  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id, email: p.email, fullName: p.full_name, avatarUrl: p.avatar_url }));
}
