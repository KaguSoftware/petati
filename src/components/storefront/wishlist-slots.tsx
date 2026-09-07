import type { ReactNode } from "react";
import { getSessionUser } from "@/lib/auth/session";
import { getMyWishlistIds } from "@/lib/account/queries";
import { WishlistButton } from "./shared/wishlist-button";

/** Builds the product id → wishlist toggle map for signed-in users. Dynamic: call inside Suspense. */
export async function wishlistSlotsFor(storeId: string, storeSlug: string, productIds: string[]): Promise<Record<string, ReactNode> | undefined> {
  const user = await getSessionUser();
  if (!user) return undefined;
  const ids = await getMyWishlistIds(storeId);
  return Object.fromEntries(
    productIds.map((id) => [id, <WishlistButton key={id} storeSlug={storeSlug} productId={id} active={ids.has(id)} />]),
  );
}
