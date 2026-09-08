import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/session";
import type { Permission } from "@/lib/auth/permissions";

export class NotInStoreError extends Error {
  constructor(table: string, id: string) {
    super(`${table} ${id} does not belong to this store`);
    this.name = "NotInStoreError";
  }
}

/**
 * Gate for every admin mutation: checks the permission on `storeId`, then hands back the
 * service-role client. Callers MUST still scope every query with `.eq("store_id", storeId)`.
 */
export async function adminMutation(storeId: string, permission: Permission) {
  const { user, role } = await requirePermission(storeId, permission);
  return { user, role, db: createSupabaseAdminClient() };
}

type Db = ReturnType<typeof createSupabaseAdminClient>;

/** Child tables without a `store_id` (translations, images, order items…) are checked through their parent. */
async function assertRow(db: Db, table: string, id: string, storeId: string) {
  const { data } = await db.from(table).select("store_id").eq("id", id).maybeSingle<{ store_id: string }>();
  if (!data || data.store_id !== storeId) throw new NotInStoreError(table, id);
}

export const assertProductInStore = (db: Db, id: string, storeId: string) => assertRow(db, "products", id, storeId);
export const assertVariantInStore = (db: Db, id: string, storeId: string) => assertRow(db, "product_variants", id, storeId);
export const assertCategoryInStore = (db: Db, id: string, storeId: string) => assertRow(db, "categories", id, storeId);
export const assertOrderInStore = (db: Db, id: string, storeId: string) => assertRow(db, "orders", id, storeId);
export const assertCustomerInStore = (db: Db, id: string, storeId: string) => assertRow(db, "customers", id, storeId);
export const assertCouponInStore = (db: Db, id: string, storeId: string) => assertRow(db, "coupons", id, storeId);
export const assertReviewInStore = (db: Db, id: string, storeId: string) => assertRow(db, "reviews", id, storeId);
export const assertExpenseInStore = (db: Db, id: string, storeId: string) => assertRow(db, "expenses", id, storeId);

/** Map a thrown error to an `ActionState.error` key without leaking internals. */
export function actionError(err: unknown): string {
  if (err && typeof err === "object" && "name" in err) {
    const name = (err as { name: string }).name;
    if (name === "ForbiddenError") return "forbidden";
    if (name === "NotInStoreError") return "notFound";
  }
  if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") return "unique";
  return "failed";
}
