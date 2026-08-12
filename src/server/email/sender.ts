// Transactional email boundary. Callers depend on this interface; the stub is
// swapped for a Resend/Postmark sender later with no changes to the checkout flow.

import type { Order } from "@/domain/order";

export interface EmailResult {
  sent: boolean;
  provider: string;
  detail?: string;
}

export interface EmailSender {
  sendOrderConfirmation(order: Order): Promise<EmailResult>;
}
