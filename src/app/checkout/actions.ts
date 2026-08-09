"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCatalogRepository } from "@/data";
import { prepareCheckout } from "@/server/checkout";
import { createCheckoutSession, stripeStatus } from "@/server/stripe";

export interface CheckoutState {
  error?: string;
}

const ids = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export async function startCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const componentIds = ids(formData.get("c"));
  const extraIds = ids(formData.get("e"));
  const expectedTotalCents = Number(formData.get("t") ?? 0);
  const pickup = String(formData.get("pickup") ?? "");
  const tosAccepted = formData.get("tos") === "on";

  // Server-side re-validation + gates. Never trusts the client total.
  const prepared = await prepareCheckout({
    lineSlug: "off-road",
    componentIds,
    extraIds,
    expectedTotalCents,
    pickup,
    tosAccepted,
  });

  if (!prepared.ok) {
    const message =
      prepared.code === "tos_not_accepted"
        ? "Please accept the Terms of Service to continue."
        : prepared.code === "invalid_pickup"
          ? "Please choose a pickup location."
          : "Your build could not be validated. Please review it in the configurator.";
    return { error: message };
  }

  const status = stripeStatus();
  if (!status.configured) {
    return {
      error: `Order re-validated server-side ✓. Payment isn't enabled yet — ${status.reason} Set STRIPE_SECRET_KEY to a test key (sk_test_…) to complete checkout.`,
    };
  }

  const catalog = await getCatalogRepository().getCatalog("off-road");
  const h = await headers();
  const host = h.get("host");
  const origin = host ? `${h.get("x-forwarded-proto") ?? "http"}://${host}` : "";
  const { url } = await createCheckoutSession({
    validation: prepared.validation,
    currency: catalog?.line.currency ?? "EUR",
    pickup,
    origin,
  });
  redirect(url);
}
