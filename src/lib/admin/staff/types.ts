import type { StoreRole } from "@/lib/db/types";

/** A store member joined with their profile (admin staff table). */
export interface StaffMember {
  userId: string;
  role: StoreRole;
  joinedAt: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

/** Platform owner (profiles.platform_role = 'owner'); implicit access to every store. */
export interface OwnerProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

/** Roles a store membership can hold (the `store_role` enum). Owners are not members. */
export const STORE_ROLES = ["manager", "staff"] as const;
