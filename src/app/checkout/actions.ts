"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCatalogRepository } from "@/data";
import { CATEGORY_ORDER } from "@/domain/types";
import { prepareCheckout } from "@/server/checkout";
import { createCheckoutSession, stripeStatus } from "@/server/stripe";
import { getOrderRepository } from "@/server/orders";
import { getEmailSender } from "@/server/email";

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
  const email = String(formData.get("email") ?? "").trim() || undefined;

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

  const catalog = await getCatalogRepository().getCatalog("off-road");
  const currency = catalog?.line.currency ?? "EUR";
  const orderComponentIds = CATEGORY_ORDER.map((c) => prepared.validation.selection?.[c]).filter(
    (x): x is string => !!x,
  );

  // Persist the order and send the confirmation. NOTE: payment is currently
  // stubbed — when Stripe is wired, move order creation to the payment-success
  // webhook and create the session BEFORE redirecting.
  const order = await getOrderRepository().create({
    lineSlug: "off-road",
    componentIds: orderComponentIds,
    extraIds: prepared.validation.extraIds ?? [],
    totalCents: prepared.validation.totalCents ?? 0,
    currency,
    pickup,
    customerEmail: email,
  });
  await getEmailSender().sendOrderConfirmation(order);

  const status = stripeStatus();
  if (status.configured) {
    const h = await headers();
    const host = h.get("host");
    const origin = host ? `${h.get("x-forwarded-proto") ?? "http"}://${host}` : "";
    const { url } = await createCheckoutSession({
      validation: prepared.validation,
      currency,
      pickup,
      origin,
    });
    redirect(url);
  }

  // No Stripe configured: complete the (stubbed-payment) order and show it.
  redirect(`/checkout/success?order=${order.id}`);
}
