import type { PaymentProviderAdapter } from "./provider";

/**
 * SCOPE(payments): iyzico is not wired yet; the client has not supplied merchant credentials.
 * GROWS LATER → implement Checkout Form initialize (createPayment → { kind: "redirect" }), the
 * callback/webhook verification (HMAC-SHA256 of the payload with the secret key) and refunds.
 * Env vars to add then: IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL (sandbox vs live).
 */
export const iyzicoProvider: PaymentProviderAdapter = {
  key: "iyzico",
  async createPayment() {
    throw new Error("iyzico provider not configured");
  },
  async handleWebhook() {
    throw new Error("iyzico provider not configured");
  },
  async refund() {
    throw new Error("iyzico provider not configured");
  },
  async markPaid() {
    throw new Error("iyzico payments are confirmed by webhook, not manually");
  },
};
