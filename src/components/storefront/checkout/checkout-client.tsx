"use client";

import { createContext, useContext, useState } from "react";
import { useTranslations } from "next-intl";
import { computeTotals } from "@/lib/checkout/totals";
import type { CartLine } from "@/lib/cart/cart";
import type { CouponRow, ShippingRateRow } from "@/lib/db/types";
import { formatMoney } from "@/lib/money";
import { ProductImage } from "@/components/storefront/shared/product-image";

interface Ctx {
  rateId: string | null;
  setRateId: (id: string) => void;
}
const CheckoutCtx = createContext<Ctx | null>(null);

export function CheckoutProvider({ initialRateId, children }: { initialRateId: string | null; children: React.ReactNode }) {
  const [rateId, setRateId] = useState(initialRateId);
  return <CheckoutCtx.Provider value={{ rateId, setRateId }}>{children}</CheckoutCtx.Provider>;
}

export function useCheckoutShipping() {
  const ctx = useContext(CheckoutCtx);
  if (!ctx) throw new Error("CheckoutProvider missing");
  return ctx;
}

interface SummaryProps {
  lines: CartLine[];
  subtotal: number;
  coupon: CouponRow | null;
  rates: ShippingRateRow[];
  store: { tax_rate_bp: number; prices_include_tax: boolean };
  currency: string;
  locale: string;
}

/** Live order summary; recomputes when the shipping choice changes. */
export function CheckoutSummary({ lines, subtotal, coupon, rates, store, currency, locale }: SummaryProps) {
  const t = useTranslations("cart");
  const { rateId } = useCheckoutShipping();
  const rate = rates.find((r) => r.id === rateId) ?? rates[0] ?? null;
  const totals = computeTotals({ subtotal, coupon }, rate, store);
  const money = (n: number) => formatMoney(n, currency, locale);

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {lines.map((l) => (
          <li key={l.id} className="flex items-center gap-3 text-sm">
            <ProductImage src={l.imageUrl} alt={l.name} className="size-14 shrink-0 rounded-md" sizes="56px" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{l.name}</p>
              <p className="text-muted-foreground">
                {l.variantLabel ? `${l.variantLabel} · ` : ""}× {l.quantity}
              </p>
            </div>
            <span className="tabular-nums">{money(l.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-1.5 border-t pt-4 text-sm">
        <div className="flex justify-between"><dt>{t("subtotal")}</dt><dd className="tabular-nums">{money(totals.subtotal)}</dd></div>
        {totals.discount > 0 && <div className="flex justify-between"><dt>{t("discount")}{coupon ? ` (${coupon.code})` : ""}</dt><dd className="tabular-nums">−{money(totals.discount)}</dd></div>}
        <div className="flex justify-between"><dt>{t("shipping")}</dt><dd className="tabular-nums">{totals.shipping === 0 ? t("freeShipping") : money(totals.shipping)}</dd></div>
        {totals.tax > 0 && <div className="flex justify-between text-muted-foreground"><dt>{t("tax")}</dt><dd className="tabular-nums">{money(totals.tax)}</dd></div>}
        <div className="mt-1 flex justify-between border-t pt-2 text-base font-semibold"><dt>{t("total")}</dt><dd className="tabular-nums">{money(totals.total)}</dd></div>
      </dl>
    </div>
  );
}
