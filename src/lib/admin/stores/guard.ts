import "server-only";

import { requirePlatformPermission } from "@/lib/auth/session";
import type { Permission } from "@/lib/auth/permissions";

/**
 * Every store-management entry point goes through here: only a platform owner may list, create
 * or edit stores. Store-level managers/staff never see the multi-store UI.
 */
export async function requireMultiStore(permission: Permission) {
  return requirePlatformPermission(permission);
}
