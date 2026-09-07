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
    <div className="flex items-center gap-2" aria-busy={pending}>
      <div className="inline-flex items-center rounded-md border">
        <button type="button" aria-label="-" className="px-2 py-1.5 disabled:opacity-40" disabled={pending || quantity <= 1} onClick={() => set(quantity - 1)}>
          <Minus className="size-4" />
        </button>
        <span className="min-w-8 text-center text-sm tabular-nums">{quantity}</span>
        <button
          type="button"
          aria-label="+"
          className="px-2 py-1.5 disabled:opacity-40"
          disabled={pending || (maxQty !== null && quantity >= maxQty)}
          onClick={() => set(quantity + 1)}
        >
          <Plus className="size-4" />
        </button>
      </div>
      <button type="button" aria-label="remove" className="p-1.5 text-muted-foreground hover:text-destructive" disabled={pending} onClick={() => set(0)}>
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
