import { renderSection } from "@/lib/theme/registry";
import type { StoreContext } from "@/lib/tenant/context";
import type { ReactNode } from "react";
import type { ProductCardData } from "@/lib/catalog/types";
import { wishlistSlotsFor } from "./wishlist-slots";

interface Props {
  ctx: StoreContext;
  products: ProductCardData[];
  title?: string;
  emptyLabel: string;
  emptyAction?: ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
  bare?: boolean;
}

/** Product grid in the store's variant, with per-card wishlist toggles for signed-in users. Dynamic. */
export async function ProductGridWithWishlist({ ctx, products, title, emptyLabel, emptyAction, viewAllHref, viewAllLabel, bare }: Props) {
  const { store, locale } = ctx;
  const wishlistSlots = await wishlistSlotsFor(store.id, store.slug, products.map((p) => p.id));
  return renderSection("productGrid", store.theme.sections.productGrid, {
    title,
    products,
    currency: store.currency,
    locale,
    cardVariant: store.theme.sections.productCard,
    emptyLabel,
    emptyAction,
    wishlistSlots,
    viewAllHref,
    viewAllLabel,
    bare,
  });
}
