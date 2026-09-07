import type { PaymentProviderAdapter } from "./provider";

/**
 * "Pay later": the order is created as pending_payment and a manager marks it paid from the admin
 * after collecting money offline (bank transfer, cash on delivery...).
 */
export const manualProvider: PaymentProviderAdapter = {
  key: "manual",
  async createPayment() {
    return { kind: "none" };
  },
  async handleWebhook() {
    throw new Error("manual provider has no webhooks");
  },
  async refund() {
    return { providerRef: null };
  },
};
