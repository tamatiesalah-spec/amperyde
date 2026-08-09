// Stripe session creation. TEST/SANDBOX KEYS ONLY — this module hard-refuses any
// key that is not a Stripe test secret (`sk_test_...`), so a live key can never
// be used here by accident until that guard is deliberately changed.

import Stripe from "stripe";
import type { OrderValidation } from "@/domain/checkout";

const TEST_KEY_PREFIX = "sk_test_";

export function stripeStatus(): { configured: boolean; reason?: string } {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { configured: false, reason: "STRIPE_SECRET_KEY is not set." };
  if (!key.startsWith(TEST_KEY_PREFIX)) {
    return { configured: false, reason: "Only Stripe TEST keys (sk_test_…) are allowed." };
  }
  return { configured: true };
}

export async function createCheckoutSession(opts: {
  validation: OrderValidation;
  currency: string;
  pickup: string;
  origin: string;
}): Promise<{ url: string }> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith(TEST_KEY_PREFIX)) {
    // Belt-and-braces: never proceed with a non-test key.
    throw new Error("Refusing to create a session without a Stripe TEST key.");
  }
  const stripe = new Stripe(key);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: opts.currency.toLowerCase(),
          product_data: { name: "AMPERYDE custom off-road build" },
          unit_amount: opts.validation.totalCents ?? 0,
        },
        quantity: 1,
      },
    ],
    metadata: { pickup: opts.pickup },
    success_url: `${opts.origin}/checkout/success`,
    cancel_url: `${opts.origin}/checkout`,
  });
  if (!session.url) throw new Error("Stripe did not return a session URL.");
  return { url: session.url };
}
