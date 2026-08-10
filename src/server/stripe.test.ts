import { afterEach, describe, expect, it } from "vitest";
import { stripeStatus } from "@/server/stripe";

// Locks the "TEST keys only, never live" invariant: stripeStatus() gates whether
// a Stripe session is ever created, so a live/malformed key must read as
// not-configured.

describe("stripeStatus — test-keys-only guard", () => {
  const original = process.env.STRIPE_SECRET_KEY;
  afterEach(() => {
    if (original === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = original;
  });

  it("is not configured when no key is set", () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(stripeStatus().configured).toBe(false);
  });

  it("REFUSES a live key", () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_deadbeef";
    const s = stripeStatus();
    expect(s.configured).toBe(false);
    expect(s.reason).toMatch(/test/i);
  });

  it("refuses a wrong-prefix key", () => {
    process.env.STRIPE_SECRET_KEY = "pk_test_notasecret";
    expect(stripeStatus().configured).toBe(false);
  });

  it("accepts a test key", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_abc123";
    expect(stripeStatus().configured).toBe(true);
  });
});
