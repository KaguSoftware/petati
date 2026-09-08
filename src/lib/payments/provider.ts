import type { OrderRow, PaymentProvider, PaymentRow } from "@/lib/db/types";

export interface CreatePaymentInput {
  order: OrderRow;
  /** Absolute URL to send the customer back to after the gateway. */
  returnUrl: string;
  locale: string;
}

export type CreatePaymentResult =
  | { kind: "none" } // manual: nothing to do, order stays pending_payment
  | { kind: "redirect"; url: string } // hosted gateway page
  | { kind: "client"; token: string }; // gateway JS SDK token

export interface WebhookResult {
  orderId: string;
  status: "paid" | "failed";
  providerRef: string;
  raw: unknown;
}

/**
 * Contract every payment gateway implements. Adding iyzico means writing iyzico.ts and registering
 * it in index.ts; the checkout and admin never need to change.
 */
export interface PaymentProviderAdapter {
  readonly key: PaymentProvider;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  /** Verify signature and translate the gateway callback. Throw on invalid signature. */
  handleWebhook(request: Request): Promise<WebhookResult>;
  refund(payment: PaymentRow, amountMinor: number): Promise<{ providerRef: string | null }>;
  /** Admin marked the order as paid offline (bank transfer, cash). Gateways should throw. */
  markPaid(payment: PaymentRow, reference?: string | null): Promise<{ providerRef: string | null }>;
}
