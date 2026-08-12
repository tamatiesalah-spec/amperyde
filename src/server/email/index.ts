// Email sender factory. Returns a no-op stub until a provider is configured —
// same gate pattern as Stripe (unconfigured => logged, not sent). Swap for a
// Resend/Postmark implementation (same EmailSender interface) when the key is set.

import type { Order } from "@/domain/order";
import type { EmailResult, EmailSender } from "@/server/email/sender";

class StubEmailSender implements EmailSender {
  async sendOrderConfirmation(order: Order): Promise<EmailResult> {
    console.info(
      `[email:stub] order confirmation ${order.reference} -> ${order.customerEmail ?? "(no address)"} · ${order.totalCents} ${order.currency} · pickup ${order.pickup}`,
    );
    return { sent: false, provider: "stub", detail: "No email provider configured (set RESEND_API_KEY)." };
  }
}

let instance: EmailSender | null = null;

export function getEmailSender(): EmailSender {
  if (!instance) {
    // if (process.env.RESEND_API_KEY) instance = new ResendEmailSender();
    instance = new StubEmailSender();
  }
  return instance;
}

export type { EmailSender, EmailResult } from "@/server/email/sender";
