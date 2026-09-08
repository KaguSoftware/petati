"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateCartItemAction } from "@/lib/cart/actions";
import { toast } from "sonner";

export function CartLineControls({
  storeSlug,
  itemId,
  quantity,
  maxQty,
}: {
  storeSlug: string;
  itemId: string;
  quantity: number;
  maxQty: number | null;
}) {
  const t = useTranslations("product");
  const tc = useTranslations("cart");
  const [pending, start] = useTransition();
  const set = (q: number) =>
    start(async () => {
      const fd = new FormData();
      fd.set("storeSlug", storeSlug);
      fd.set("itemId", itemId);
      fd.set("quantity", String(q));
      const res = await updateCartItemAction(fd);
      if (res.error === "out_of_stock") toast.error(t("outOfStock"));
    });

  return (
    <div className="flex items-center gap-3" aria-busy={pending}>
      {/* Steppers read left-to-right in every locale: minus, count, plus. */}
      <div dir="ltr" className="inline-flex h-10 items-center rounded-lg border">
        <button type="button" aria-label="-" className="grid size-10 place-items-center rounded-s-lg transition-colors hover:bg-muted disabled:opacity-40" disabled={pending || quantity <= 1} onClick={() => set(quantity - 1)}>
          <Minus className="size-4" />
        </button>
        <span className="min-w-8 text-center text-sm tabular-nums">{quantity}</span>
        <button
          type="button"
          aria-label="+"
          className="grid size-10 place-items-center rounded-e-lg transition-colors hover:bg-muted disabled:opacity-40"
          disabled={pending || (maxQty !== null && quantity >= maxQty)}
          onClick={() => set(quantity + 1)}
        >
          <Plus className="size-4" />
        </button>
      </div>
      <button
        type="button"
        aria-label={tc("remove")}
        className="grid size-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
        disabled={pending}
        onClick={() => set(0)}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
