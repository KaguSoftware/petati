"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyCouponAction, removeCouponAction, type CartActionState } from "@/lib/cart/actions";

export function CouponForm({ storeSlug, appliedCode }: { storeSlug: string; appliedCode: string | null }) {
  const t = useTranslations("cart");
  const [state, action, pending] = useActionState(applyCouponAction, {} as CartActionState);

  if (appliedCode) {
    return (
      <form action={removeCouponAction} className="flex items-center justify-between rounded-md border border-dashed px-3 py-2 text-sm">
        <input type="hidden" name="storeSlug" value={storeSlug} />
        <span>
          {t("couponCode")}: <strong>{appliedCode}</strong>
        </span>
        <button type="submit" aria-label={t("remove")} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </form>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="storeSlug" value={storeSlug} />
      <div className="flex gap-2">
        <Input name="code" placeholder={t("couponCode")} aria-label={t("couponCode")} required className="uppercase" />
        <Button type="submit" variant="outline" disabled={pending}>
          {t("applyCoupon")}
        </Button>
      </div>
      {state.error === "coupon_invalid" && <p className="text-sm text-destructive">{t("couponInvalid")}</p>}
    </form>
  );
}
