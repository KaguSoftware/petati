import "server-only";

import { ForbiddenError, requirePlatformPermission } from "@/lib/auth/session";
import type { Permission } from "@/lib/auth/permissions";
import { features } from "@/lib/env";

/**
 * SCOPE(multi-store, unpaid): every store-management entry point goes through here. The feature
 * flag is checked first so that, with the flag off, even a platform owner sees nothing.
 * GROWS LATER → drop the flag check once the client pays for multi-store.
 */
export async function requireMultiStore(permission: Permission) {
  if (!features.multiStore()) throw new ForbiddenError(permission);
  return requirePlatformPermission(permission);
}
