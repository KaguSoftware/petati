import "server-only";

import { Resend } from "resend";
import { env } from "@/lib/env";

export interface SendEmailInput {
  to: string;
  from?: string | null;
  subject: string;
  react: React.ReactElement;
}

/** Sends through Resend when configured; otherwise logs so local dev never blocks on email. */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const from = input.from ?? env.emailFromFallback();
  const key = env.resendApiKey();
  if (!key) {
    console.info(`[email:dev] to=${input.to} from=${from} subject="${input.subject}"`);
    return;
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    react: input.react,
  });
  if (error) console.error("[email] send failed", error);
}
