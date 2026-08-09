// Checkout guard — the gate that must pass before any payment session is
// created. Re-validates the order server-side (never trusting the client total)
// and enforces the T&C acceptance and a valid pickup location. Kept free of the
// Stripe SDK so it is unit-testable (see checkout.test.ts); Stripe session
// creation lives in src/server/stripe.ts and only runs after this returns ok.

import { revalidateOrder } from "@/server/revalidateOrder";
import type { OrderRequest, OrderValidation } from "@/domain/checkout";

// Pickup-only fulfilment (see the Terms draft). Placeholder locations.
export const PICKUP_LOCATIONS = [
  "Den Haag Centraal",
  "Rotterdam Centraal",
  "Amsterdam Centraal",
] as const;
export type PickupLocation = (typeof PICKUP_LOCATIONS)[number];

export interface CheckoutInput extends OrderRequest {
  pickup: string;
  tosAccepted: boolean;
}

export type PrepareResult =
  | { ok: true; validation: OrderValidation }
  | {
      ok: false;
      code: "tos_not_accepted" | "invalid_pickup" | "invalid_build";
      validation?: OrderValidation;
    };

export async function prepareCheckout(input: CheckoutInput): Promise<PrepareResult> {
  if (!input.tosAccepted) return { ok: false, code: "tos_not_accepted" };
  if (!PICKUP_LOCATIONS.includes(input.pickup as PickupLocation)) {
    return { ok: false, code: "invalid_pickup" };
  }
  const validation = await revalidateOrder(input);
  if (!validation.ok) return { ok: false, code: "invalid_build", validation };
  return { ok: true, validation };
}
