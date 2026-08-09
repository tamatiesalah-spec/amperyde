import { describe, expect, it } from "vitest";
import { offRoadCatalog } from "@/data/seed/offRoad";
import { buildContext, selectionFromComponentIds } from "@/domain/compatibility";
import { priceSelection } from "@/domain/pricing";
import { prepareCheckout, type CheckoutInput } from "@/server/checkout";

// The checkout GUARD sits in front of payment. It must reject unless: T&C
// accepted, a valid pickup location, AND the order re-validates server-side
// (correct total, compatible & complete build). This is the "someone pays the
// wrong amount" path — covered here with the tamper vectors, not just happy path.

const ctx = buildContext(offRoadCatalog.components, offRoadCatalog.incompatibilities);
const apex = offRoadCatalog.presets.find((p) => p.name === "Apex")!;
const total = priceSelection(offRoadCatalog.line, selectionFromComponentIds(apex.componentIds, ctx), ctx, {
  all: offRoadCatalog.extras,
  selectedIds: apex.extraIds ?? [],
}).totalCents;

const input = (over: Partial<CheckoutInput> = {}): CheckoutInput => ({
  lineSlug: "off-road",
  componentIds: apex.componentIds,
  extraIds: apex.extraIds,
  expectedTotalCents: total,
  pickup: "Rotterdam Centraal",
  tosAccepted: true,
  ...over,
});

describe("prepareCheckout", () => {
  it("passes a valid, T&C-accepted, correctly-priced order", async () => {
    const r = await prepareCheckout(input());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.validation.totalCents).toBe(total);
  });

  it("blocks when the T&C are not accepted", async () => {
    const r = await prepareCheckout(input({ tosAccepted: false }));
    expect(r).toMatchObject({ ok: false, code: "tos_not_accepted" });
  });

  it("blocks an invalid / spoofed pickup location", async () => {
    const r = await prepareCheckout(input({ pickup: "My House" }));
    expect(r).toMatchObject({ ok: false, code: "invalid_pickup" });
  });

  it("blocks a tampered (lowered) total", async () => {
    const r = await prepareCheckout(input({ expectedTotalCents: total - 40000 }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("invalid_build");
      expect(r.validation?.errors.map((e) => e.code)).toContain("price_mismatch");
    }
  });

  it("blocks an incompatible build (foot pegs on a mid-drive)", async () => {
    const ids = [...apex.componentIds];
    ids[ids.indexOf("pedals-standard")] = "foot-pegs"; // apex is mid-drive
    const r = await prepareCheckout(input({ componentIds: ids, expectedTotalCents: total + 5000 }));
    expect(r).toMatchObject({ ok: false, code: "invalid_build" });
  });

  it("blocks an unknown component id", async () => {
    const ids = [...apex.componentIds.slice(0, 13), "totally-bogus"];
    const r = await prepareCheckout(input({ componentIds: ids }));
    expect(r).toMatchObject({ ok: false, code: "invalid_build" });
  });
});
