"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { getRoleForStore } from "@/lib/auth/session";

/** Remember which store the admin is working on. Validated against the user's access. */
export async function switchAdminStoreAction(storeId: string) {
  const id = z.string().uuid().parse(storeId);
  const role = await getRoleForStore(id);
  if (!role) throw new Error("Forbidden");
  const cookieStore = await cookies();
  cookieStore.set("admin_store", id, { path: "/", sameSite: "lax", httpOnly: true });
}
