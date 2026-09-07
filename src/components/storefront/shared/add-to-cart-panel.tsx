"use client";

import { useActionState, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCartAction, type CartActionState } from "@/lib/cart/actions";
import type { ProductDetail } from "@/lib/catalog/types";
import { Price } from "./price";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  product: ProductDetail;
  storeSlug: string;
  currency: string;
  locale: string;
}

/** Option pickers → resolved variant → quantity → add. Shared by every product-page variant. */
export function AddToCartPanel({ product, storeSlug, currency, locale }: Props) {
  const t = useTranslations("product");
  const tc = useTranslations("cart");
  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const opt of product.options) {
      const v = opt.values.find((val) => defaultVariant?.optionValueIds.includes(val.id));
      if (v) init[opt.id] = v.id;
    }
    return init;
  });
  const [qty, setQty] = useState(1);

  const variant = useMemo(() => {
    if (product.options.length === 0) return defaultVariant;
    const chosen = Object.values(selected);
    return product.variants.find((v) => chosen.every((id) => v.optionValueIds.includes(id)));
  }, [product, selected, defaultVariant]);

  const available = variant
    ? !variant.trackInventory || variant.allowBackorder || variant.stockQty > 0
    : false;
  const maxQty = variant && variant.trackInventory && !variant.allowBackorder ? variant.stockQty : 99;

  const [state, action, pending] = useActionState(
    async (prev: CartActionState, fd: FormData) => {
      const res = await addToCartAction(prev, fd);
      if (res.ok) toast.success(t("addToCart"));
      else if (res.error === "out_of_stock") toast.error(t("outOfStock"));
      return res;
    },
    {} as CartActionState,
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="storeSlug" value={storeSlug} />
      {variant && <input type="hidden" name="variantId" value={variant.id} />}
      <input type="hidden" name="quantity" value={qty} />

      {variant && (
        <Price amount={variant.price} compareAt={variant.compareAtPrice} currency={currency} locale={locale} className="text-2xl" />
      )}

      {product.options.map((opt) => (
        <fieldset key={opt.id} className="flex flex-col gap-2">
          <legend className="text-sm font-medium">{opt.name}</legend>
          <div className="flex flex-wrap gap-2">
            {opt.values.map((val) => {
              const active = selected[opt.id] === val.id;
              return (
                <button
                  key={val.id}
                  type="button"
                  onClick={() => setSelected((s) => ({ ...s, [opt.id]: val.id }))}
                  className={cn(
                    "min-w-10 rounded-md border px-3 py-1.5 text-sm transition",
                    active ? "border-primary bg-primary text-primary-foreground" : "hover:border-foreground",
                  )}
                  style={val.swatch ? { backgroundColor: active ? undefined : val.swatch } : undefined}
                >
                  {val.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex items-center gap-3">
        <div className="inline-flex items-center rounded-md border">
          <button type="button" aria-label="-" className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>
            <Minus className="size-4" />
          </button>
          <span className="min-w-8 text-center tabular-nums">{qty}</span>
          <button type="button" aria-label="+" className="px-3 py-2" onClick={() => setQty((q) => Math.min(maxQty, q + 1))}>
            <Plus className="size-4" />
          </button>
        </div>
        <span className="text-sm text-muted-foreground">
          {!variant
            ? t("selectOption", { option: product.options[0]?.name ?? "" })
            : available
              ? variant.trackInventory && variant.stockQty <= 5 && !variant.allowBackorder
                ? t("lowStock", { count: variant.stockQty })
                : t("inStock")
              : t("outOfStock")}
        </span>
      </div>

      <Button type="submit" size="lg" disabled={!variant || !available || pending} className="w-full">
        {available ? t("addToCart") : t("outOfStock")}
      </Button>
      {state.error === "invalid" && <p className="text-sm text-destructive">{tc("couponInvalid")}</p>}
    </form>
  );
}
