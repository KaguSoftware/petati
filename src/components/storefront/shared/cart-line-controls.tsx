"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateCartItemAction } from "@/lib/cart/actions";
import { toast } from "sonner";
import { QuantityStepper } from "./quantity-stepper";

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
      <QuantityStepper value={quantity} onChange={set} max={maxQty} disabled={pending} />
      <button
        type="button"
        aria-label={tc("remove")}
        className="grid size-11 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
        disabled={pending}
        onClick={() => set(0)}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
