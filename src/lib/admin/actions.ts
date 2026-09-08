"use server";

import { cookies } from "next/headers";
import { ForbiddenError, getRoleForStore } from "@/lib/auth/session";
import { features } from "@/lib/env";
import { ADMIN_STORE_COOKIE } from "./constants";
import { uuidField } from "./validate";

/**
 * Remember which store the admin is working on. Validated against the user's access.
 * SCOPE(multi-store, unpaid): only meaningful when FEATURE_MULTI_STORE is on.
 */
export async function switchAdminStoreAction(storeId: string) {
  if (!features.multiStore()) throw new ForbiddenError("store.create");
  const id = uuidField.parse(storeId);
  const role = await getRoleForStore(id);
  if (!role) throw new ForbiddenError("store.settings");
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_STORE_COOKIE, id, { path: "/", sameSite: "lax", httpOnly: true });
}
