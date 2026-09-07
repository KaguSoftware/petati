import type { PaymentProvider } from "@/lib/db/types";
import { iyzicoProvider } from "./iyzico";
import { manualProvider } from "./manual";
import type { PaymentProviderAdapter } from "./provider";

const providers: Record<PaymentProvider, PaymentProviderAdapter> = {
  manual: manualProvider,
  iyzico: iyzicoProvider,
};

/** Which provider a store uses. Read from store.settings.payment_provider, default manual. */
export function getPaymentProvider(store: { settings: Record<string, unknown> }): PaymentProviderAdapter {
  const key = store.settings?.payment_provider;
  if (key === "iyzico" && process.env.IYZICO_API_KEY) return providers.iyzico;
  return providers.manual;
}

export function getProviderByKey(key: string): PaymentProviderAdapter | null {
  return (providers as Record<string, PaymentProviderAdapter>)[key] ?? null;
}
