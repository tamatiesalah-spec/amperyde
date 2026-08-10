"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { startCheckout, type CheckoutState } from "./actions";

export function CheckoutForm({
  componentIds,
  extraIds,
  totalCents,
  totalLabel,
  pickupLocations,
  stripeConfigured,
}: {
  componentIds: string;
  extraIds: string;
  totalCents: number;
  totalLabel: string;
  pickupLocations: string[];
  stripeConfigured: boolean;
}) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(startCheckout, {});
  const [tos, setTos] = useState(false);
  const [pickup, setPickup] = useState(pickupLocations[0] ?? "");

  return (
    <form action={formAction} className="rounded-2xl border border-line bg-surface p-6">
      <input type="hidden" name="c" value={componentIds} />
      <input type="hidden" name="e" value={extraIds} />
      <input type="hidden" name="t" value={totalCents} />

      <fieldset>
        <legend className="text-sm font-semibold">Pickup location</legend>
        <p className="mt-0.5 text-xs text-faint">Collection only — no shipping. (Placeholder locations.)</p>
        <div className="mt-3 space-y-2">
          {pickupLocations.map((loc) => (
            <label key={loc} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="pickup"
                value={loc}
                checked={pickup === loc}
                onChange={() => setPickup(loc)}
                className="accent-brand"
              />
              {loc}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-5 flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="tos"
          checked={tos}
          onChange={(e) => setTos(e.target.checked)}
          className="mt-0.5 accent-brand"
        />
        <span className="text-muted">
          I accept the{" "}
          <Link href="/terms" target="_blank" className="text-brand underline underline-offset-2">
            Terms of Service
          </Link>{" "}
          and understand this bike is for private-terrain use only.
        </span>
      </label>

      {state.error && (
        <p className="mt-4 rounded-lg border border-ember/40 bg-ember/10 px-3 py-2 text-xs text-ember">
          {state.error}
        </p>
      )}

      <p className="mt-4 flex items-center gap-2 text-xs text-muted">
        <span className="rounded bg-[#ffb3c7] px-1.5 py-0.5 font-semibold text-black">Klarna</span>
        Pay by card, or with Klarna — pay later or split into instalments — at the secure payment step.
      </p>

      <button
        type="submit"
        disabled={!tos || pending}
        className={`mt-5 w-full rounded-full px-6 py-3 text-sm font-semibold transition ${
          tos && !pending ? "bg-brand text-white hover:bg-brand-bright" : "cursor-not-allowed bg-surface-3 text-faint"
        }`}
      >
        {pending ? "Validating…" : `Pay ${totalLabel}`}
      </button>

      {!stripeConfigured && (
        <p className="mt-3 text-center text-[11px] text-faint">
          Stripe test mode not configured — submitting re-validates the order and reports status.
        </p>
      )}
    </form>
  );
}
