import { ShoppingBag } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/config";
import { getCart } from "@/lib/cart/cart";
import type { Store } from "@/lib/tenant/store";
import { cn } from "@/lib/utils";
import { numberFormat } from "@/lib/number";

const iconButton = buttonVariants({ variant: "ghost", size: "icon-lg" });

/** Reads the cart cookie: dynamic. Always render inside <Suspense>. */
export async function CartButton({ store, locale }: { store: Store; locale: Locale }) {
  const t = await getTranslations("nav");
  const cart = await getCart(store, locale);
  return (
    <Link href="/cart" aria-label={t("cart")} className={cn(iconButton, "relative")}>
      <ShoppingBag className="size-5" />
      {cart.itemCount > 0 && (
        <span className="absolute top-0 end-0 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-micro leading-none font-semibold text-primary-foreground tabular-nums ring-2 ring-background">
          {numberFormat(locale).format(cart.itemCount)}
        </span>
      )}
    </Link>
  );
}

export function CartButtonFallback() {
  return (
    <span aria-hidden className={iconButton}>
      <ShoppingBag className="size-5" />
    </span>
  );
}
