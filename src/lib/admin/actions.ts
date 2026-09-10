"use server";

import { cookies } from "next/headers";
import { ForbiddenError, getRoleForStore } from "@/lib/auth/session";
import { ADMIN_STORE_COOKIE } from "./constants";
import { uuidField } from "./validate";

/**
 * Remember which store the admin is working on. Validated against the user's access.
 */
export async function switchAdminStoreAction(storeId: string) {
  const id = uuidField.parse(storeId);
  const role = await getRoleForStore(id);
  if (!role) throw new ForbiddenError("store.settings");
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_STORE_COOKIE, id, { path: "/", sameSite: "lax", httpOnly: true });
}
