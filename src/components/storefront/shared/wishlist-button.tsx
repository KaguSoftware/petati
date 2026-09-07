"use client";

import { Heart } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleWishlistAction } from "@/lib/account/actions";
import { cn } from "@/lib/utils";

export function WishlistButton({
  storeSlug,
  productId,
  active,
  className,
}: {
  storeSlug: string;
  productId: string;
  active: boolean;
  className?: string;
}) {
  const t = useTranslations("product");
  const [pending, start] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(active);

  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={optimistic ? t("removeFromWishlist") : t("addToWishlist")}
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOptimistic(!optimistic);
          const fd = new FormData();
          fd.set("storeSlug", storeSlug);
          fd.set("productId", productId);
          await toggleWishlistAction(fd);
        })
      }
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full bg-background/80 backdrop-blur transition hover:bg-background",
        className,
      )}
    >
      <Heart className={cn("size-4", optimistic && "fill-primary text-primary")} />
    </button>
  );
}
