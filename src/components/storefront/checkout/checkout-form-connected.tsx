"use client";

import { CheckoutForm, type ShippingOption } from "@/components/storefront/shared/checkout-form";
import type { AddressRow } from "@/lib/db/types";
import { useCheckoutShipping } from "./checkout-client";

interface Props {
  storeSlug: string;
  locale: string;
  currency: string;
  email: string | null;
  addresses: AddressRow[];
  shippingOptions: ShippingOption[];
  defaultCountry: string;
}

export function CheckoutFormConnected(props: Props) {
  const { setRateId } = useCheckoutShipping();
  return <CheckoutForm {...props} onShippingChange={setRateId} />;
}
