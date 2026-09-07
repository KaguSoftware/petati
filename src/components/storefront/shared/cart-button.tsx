import { ShoppingBag } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/config";
import { getCart } from "@/lib/cart/cart";
import type { Store } from "@/lib/tenant/store";

/** Reads the cart cookie: dynamic. Always render inside <Suspense>. */
export async function CartButton({ store, locale }: { store: Store; locale: Locale }) {
  const t = await getTranslations("nav");
  const cart = await getCart(store, locale);
  return (
    <Link href="/cart" aria-label={t("cart")} className="relative inline-flex size-10 items-center justify-center rounded-md hover:bg-muted">
      <ShoppingBag className="size-5" />
      {cart.itemCount > 0 && (
        <span className="absolute -top-0.5 -end-0.5 min-w-5 rounded-full bg-primary px-1 text-center text-[11px] font-semibold leading-5 text-primary-foreground">
          {cart.itemCount}
        </span>
      )}
    </Link>
  );
}

export function CartButtonFallback() {
  return (
    <span className="inline-flex size-10 items-center justify-center">
      <ShoppingBag className="size-5" />
    </span>
  );
}
