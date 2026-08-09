import { describe, expect, it } from "vitest";
import { offRoadCatalog } from "@/data/seed/offRoad";
import { buildContext, selectionFromComponentIds } from "@/domain/compatibility";
import { priceSelection } from "@/domain/pricing";
import { validateOrder, type OrderError, type OrderRequest } from "@/domain/checkout";
import type { Catalog } from "@/domain/types";

const catalog = offRoadCatalog;
const ctx = buildContext(catalog.components, catalog.incompatibilities);
const preset = (name: string) => {
  const p = catalog.presets.find((x) => x.name === name);
  if (!p) throw new Error(`missing preset ${name}`);
  return p.componentIds;
};
const totalFor = (ids: string[]) =>
  priceSelection(catalog.line, selectionFromComponentIds(ids, ctx), ctx).totalCents;

const APEX = preset("Apex"); // carbon full-sus, mid-drive, mullet — complete & valid
const TRAIL = preset("Trailhead"); // hardtail, hub — complete & valid
const correct = totalFor(APEX);

const order = (over: Partial<OrderRequest> = {}): OrderRequest => ({
  lineSlug: "off-road",
  componentIds: APEX,
  expectedTotalCents: correct,
  ...over,
});
const codes = (r: { errors: OrderError[] }) => r.errors.map((e) => e.code);
// Compatibility is symmetric, so an invalid pair is reported on BOTH sides;
// assert on the human reason rather than which category is listed first.
const incompatReasons = (r: { errors: OrderError[] }) =>
  r.errors.flatMap((e) => (e.code === "incompatible" ? [e.reason] : []));

describe("valid order", () => {
  it("accepts a complete, compatible build with the correct total", () => {
    const r = validateOrder(order(), catalog);
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.totalCents).toBe(correct);
    expect(r.breakdown?.totalCents).toBe(correct);
    expect(Object.keys(r.selection ?? {})).toHaveLength(7);
  });

  it("returns the SERVER-computed total, never trusting the client number", () => {
    const r = validateOrder(order(), catalog);
    // totalCents is derived from the trusted catalog, not echoed from the request.
    expect(r.totalCents).toBe(priceSelection(catalog.line, selectionFromComponentIds(APEX, ctx), ctx).totalCents);
  });
});

// ---------------------------------------------------------------------------
// TAMPER VECTOR 1 — mismatched total. The server must refuse any client total
// that doesn't equal its own recomputation, in EITHER direction, to the cent.
// ---------------------------------------------------------------------------
describe("tamper: price mismatch", () => {
  it("rejects a total lowered by the client", () => {
    const r = validateOrder(order({ expectedTotalCents: correct - 50000 }), catalog);
    expect(r.ok).toBe(false);
    expect(codes(r)).toEqual(["price_mismatch"]);
    const err = r.errors[0];
    expect(err).toMatchObject({ code: "price_mismatch", expectedCents: correct - 50000, actualCents: correct });
  });

  it("rejects an off-by-one-cent total (no rounding tolerance)", () => {
    const r = validateOrder(order({ expectedTotalCents: correct - 1 }), catalog);
    expect(r.ok).toBe(false);
    expect(codes(r)).toContain("price_mismatch");
    expect(r.totalCents).toBe(correct); // authoritative total handed back
  });

  it("rejects an inflated total too (protects the customer, not just the merchant)", () => {
    const r = validateOrder(order({ expectedTotalCents: correct + 100000 }), catalog);
    expect(r.ok).toBe(false);
    expect(codes(r)).toContain("price_mismatch");
  });

  it("rejects a zero / free-order attempt", () => {
    const r = validateOrder(order({ expectedTotalCents: 0 }), catalog);
    expect(r.ok).toBe(false);
    expect(codes(r)).toContain("price_mismatch");
  });
});

// ---------------------------------------------------------------------------
// TAMPER VECTOR 2 — invalid combinations that the UI prevents but a crafted
// payload could submit. Expected total is set to the server's own figure for
// each tampered build so the ONLY surfaced error is the incompatibility.
// ---------------------------------------------------------------------------
describe("tamper: invalid combinations", () => {
  it("rejects a hub motor on a full-suspension chassis", () => {
    const ids = ["chassis-fullsus-alu", "wheels-knobby", "motor-hub-1000", "battery-48-20", "brakes-2piston", "cockpit-moto", "finish-stealth"];
    const r = validateOrder({ lineSlug: "off-road", componentIds: ids, expectedTotalCents: totalFor(ids) }, catalog);
    expect(r.ok).toBe(false);
    expect(codes(r)).toContain("incompatible");
    expect(codes(r)).not.toContain("price_mismatch");
    expect(incompatReasons(r).some((x) => /hardtail/i.test(x))).toBe(true);
  });

  it("rejects a battery whose voltage doesn't match the motor", () => {
    const ids = ["chassis-fullsus-alu", "wheels-knobby", "motor-mid-5000", "battery-48-20", "brakes-2piston", "cockpit-moto", "finish-stealth"];
    const r = validateOrder({ lineSlug: "off-road", componentIds: ids, expectedTotalCents: totalFor(ids) }, catalog);
    expect(r.ok).toBe(false);
    expect(incompatReasons(r).some((x) => /match/i.test(x))).toBe(true);
  });

  it("rejects an explicitly gated pair (supermoto wheels + 2-piston brakes)", () => {
    const ids = ["chassis-hardtail-alu", "wheels-supermoto", "motor-hub-1000", "battery-48-20", "brakes-2piston", "cockpit-moto", "finish-stealth"];
    const r = validateOrder({ lineSlug: "off-road", componentIds: ids, expectedTotalCents: totalFor(ids) }, catalog);
    expect(r.ok).toBe(false);
    expect(codes(r)).toContain("incompatible");
  });

  it("rejects mullet wheels on a hardtail frame", () => {
    const ids = ["chassis-hardtail-alu", "wheels-mullet", "motor-hub-1000", "battery-48-20", "brakes-4piston", "cockpit-moto", "finish-stealth"];
    const r = validateOrder({ lineSlug: "off-road", componentIds: ids, expectedTotalCents: totalFor(ids) }, catalog);
    expect(r.ok).toBe(false);
    expect(incompatReasons(r).some((x) => /frame/i.test(x))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TAMPER VECTOR 3 — unknown / foreign / duplicate / missing components.
// ---------------------------------------------------------------------------
describe("tamper: bad component ids", () => {
  it("rejects an unknown component id", () => {
    const ids = ["chassis-hardtail-alu", "wheels-knobby", "motor-hub-1000", "battery-48-20", "brakes-2piston", "cockpit-moto", "totally-bogus-finish"];
    const r = validateOrder({ lineSlug: "off-road", componentIds: ids, expectedTotalCents: totalFor(ids) }, catalog);
    expect(r.ok).toBe(false);
    expect(r.errors.find((e) => e.code === "unknown_component")).toMatchObject({ componentId: "totally-bogus-finish" });
  });

  it("rejects a component smuggled in from another product line (line separation)", () => {
    // The off-road and street-legal lines must never mix. Simulate a street-legal
    // part appearing in the component pool and being submitted at checkout.
    const foreign = {
      ...catalog.components[0],
      id: "street-legal-plate",
      lineId: "line-street-legal",
      category: "finish" as const,
    };
    const tampered: Catalog = { ...catalog, components: [...catalog.components, foreign] };
    const ids = ["chassis-hardtail-alu", "wheels-knobby", "motor-hub-1000", "battery-48-20", "brakes-2piston", "cockpit-moto", "street-legal-plate"];
    const r = validateOrder({ lineSlug: "off-road", componentIds: ids, expectedTotalCents: 0 }, tampered);
    expect(r.ok).toBe(false);
    expect(r.errors.find((e) => e.code === "foreign_line_component")).toMatchObject({ componentId: "street-legal-plate" });
  });

  it("rejects two components in the same category", () => {
    const ids = [...TRAIL, "chassis-hardtail-carbon"]; // two chassis
    const r = validateOrder({ lineSlug: "off-road", componentIds: ids, expectedTotalCents: totalFor(ids) }, catalog);
    expect(r.ok).toBe(false);
    expect(r.errors.find((e) => e.code === "duplicate_category")).toMatchObject({ category: "chassis" });
  });

  it("rejects an incomplete build and reports the missing category", () => {
    const ids = APEX.filter((id) => id !== "finish-forged-carbon"); // drop finish
    const r = validateOrder({ lineSlug: "off-road", componentIds: ids, expectedTotalCents: totalFor(ids) }, catalog);
    expect(r.ok).toBe(false);
    expect(r.errors.find((e) => e.code === "incomplete_build")).toMatchObject({ missing: ["finish"] });
  });
});

// ---------------------------------------------------------------------------
// TAMPER VECTOR 4 — stale prices. If the catalog price changed since the client
// loaded, the client's (honest) total is now wrong; the server must catch it
// and return the authoritative new total.
// ---------------------------------------------------------------------------
describe("tamper: stale prices", () => {
  it("rejects an order priced against an outdated catalog and returns the new total", () => {
    const bump = 12000;
    const stale: Catalog = {
      ...catalog,
      components: catalog.components.map((c) =>
        c.id === "motor-mid-5000" ? { ...c, priceDeltaCents: c.priceDeltaCents + bump } : c,
      ),
    };
    // Client still holds the OLD Apex total; server prices against the new catalog.
    const r = validateOrder(order({ expectedTotalCents: correct }), stale);
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual([{ code: "price_mismatch", expectedCents: correct, actualCents: correct + bump }]);
    expect(r.totalCents).toBe(correct + bump);
  });
});

// ---------------------------------------------------------------------------
// Line resolution.
// ---------------------------------------------------------------------------
describe("line resolution", () => {
  it("rejects a checkout aimed at a different line", () => {
    const r = validateOrder(order({ lineSlug: "street-legal" }), catalog);
    expect(r.ok).toBe(false);
    expect(codes(r)).toEqual(["unknown_line"]);
  });
});
