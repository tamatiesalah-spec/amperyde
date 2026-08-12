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
  return p;
};
const totalFor = (ids: string[], extraIds: string[] = []) =>
  priceSelection(catalog.line, selectionFromComponentIds(ids, ctx), ctx, {
    all: catalog.extras,
    selectedIds: extraIds,
  }).totalCents;

const APEX = preset("Apex");
const APEX_IDS = APEX.componentIds;
const APEX_EXTRAS = APEX.extraIds ?? [];
const TRAIL = preset("Trailhead").componentIds;
const correct = totalFor(APEX_IDS, APEX_EXTRAS);

const order = (over: Partial<OrderRequest> = {}): OrderRequest => ({
  lineSlug: "off-road",
  componentIds: APEX_IDS,
  extraIds: APEX_EXTRAS,
  expectedTotalCents: correct,
  ...over,
});
const codes = (r: { errors: OrderError[] }) => r.errors.map((e) => e.code);
const incompatReasons = (r: { errors: OrderError[] }) =>
  r.errors.flatMap((e) => (e.code === "incompatible" ? [e.reason] : []));

describe("valid order", () => {
  it("accepts a complete, compatible build with extras and the correct total", () => {
    const r = validateOrder(order(), catalog);
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.totalCents).toBe(correct);
    expect(r.extraIds).toEqual(APEX_EXTRAS);
    expect(Object.keys(r.selection ?? {})).toHaveLength(15);
  });

  it("returns the server-computed total, never trusting the client number", () => {
    const r = validateOrder(order(), catalog);
    expect(r.totalCents).toBe(totalFor(APEX_IDS, APEX_EXTRAS));
  });
});

describe("tamper: price mismatch", () => {
  it("rejects a lowered total", () => {
    const r = validateOrder(order({ expectedTotalCents: correct - 50000 }), catalog);
    expect(codes(r)).toEqual(["price_mismatch"]);
    expect(r.errors[0]).toMatchObject({ code: "price_mismatch", actualCents: correct });
  });
  it("rejects an off-by-one-cent total", () => {
    const r = validateOrder(order({ expectedTotalCents: correct - 1 }), catalog);
    expect(codes(r)).toContain("price_mismatch");
    expect(r.totalCents).toBe(correct);
  });
  it("rejects an inflated total", () => {
    expect(validateOrder(order({ expectedTotalCents: correct + 100000 }), catalog).ok).toBe(false);
  });
  it("rejects a zero / free-order attempt", () => {
    expect(codes(validateOrder(order({ expectedTotalCents: 0 }), catalog))).toContain("price_mismatch");
  });
});

describe("tamper: invalid combinations", () => {
  it("rejects a hub motor on a full-suspension chassis", () => {
    const ids = ["chassis-fullsus", "wheel-29", "frame-m", "fork-coil-100", "motor-hub-750", "battery-downtube-48", "brakes-mechanical", "disc-180", "tyres-mtb", "bar-flat", "seatpost-rigid", "pedals-standard", "colour-stealth", "accent-black", "finish-matt"];
    const r = validateOrder({ lineSlug: "off-road", componentIds: ids, expectedTotalCents: totalFor(ids) }, catalog);
    expect(r.ok).toBe(false);
    expect(codes(r)).not.toContain("price_mismatch");
    expect(incompatReasons(r).some((x) => /hardtail/i.test(x))).toBe(true);
  });

  it("rejects a 52V battery on a 48V-only motor (voltage safety gate)", () => {
    const ids = ["chassis-hardtail", "wheel-29", "frame-m", "fork-coil-100", "motor-hub-750", "battery-downtube-52", "brakes-mechanical", "disc-180", "tyres-mtb", "bar-flat", "seatpost-rigid", "pedals-standard", "colour-stealth", "accent-black", "finish-matt"];
    const r = validateOrder({ lineSlug: "off-road", componentIds: ids, expectedTotalCents: totalFor(ids) }, catalog);
    expect(r.ok).toBe(false);
    expect(incompatReasons(r).some((x) => /accepts|V/i.test(x))).toBe(true);
  });

  it("rejects a triangle battery on a full-suspension chassis", () => {
    const ids = ["chassis-fullsus", "wheel-29", "frame-m", "fork-coil-100", "motor-tsdz8", "battery-triangle-52", "brakes-mechanical", "disc-180", "tyres-mtb", "bar-flat", "seatpost-rigid", "pedals-standard", "colour-stealth", "accent-black", "finish-matt"];
    const r = validateOrder({ lineSlug: "off-road", componentIds: ids, expectedTotalCents: totalFor(ids) }, catalog);
    expect(r.ok).toBe(false);
    expect(codes(r)).toContain("incompatible");
  });
});

describe("tamper: bad component ids", () => {
  it("rejects an unknown component id", () => {
    const ids = [...TRAIL.slice(0, 12), "totally-bogus"];
    const r = validateOrder({ lineSlug: "off-road", componentIds: ids, expectedTotalCents: totalFor(ids) }, catalog);
    expect(r.errors.find((e) => e.code === "unknown_component")).toMatchObject({ componentId: "totally-bogus" });
  });

  it("rejects a component from another product line", () => {
    const foreign = { ...catalog.components[0], id: "foreign-part", lineId: "line-other", category: "finish_type" as const };
    const tampered: Catalog = { ...catalog, components: [...catalog.components, foreign] };
    const ids = [...TRAIL.slice(0, 12), "foreign-part"];
    const r = validateOrder({ lineSlug: "off-road", componentIds: ids, expectedTotalCents: 0 }, tampered);
    expect(r.errors.find((e) => e.code === "foreign_line_component")).toMatchObject({ componentId: "foreign-part" });
  });

  it("rejects two components in the same category", () => {
    const ids = [...TRAIL, "chassis-fullsus"];
    const r = validateOrder({ lineSlug: "off-road", componentIds: ids, expectedTotalCents: totalFor(ids) }, catalog);
    expect(r.errors.find((e) => e.code === "duplicate_category")).toMatchObject({ category: "chassis" });
  });

  it("rejects an incomplete build and reports the missing category", () => {
    const ids = TRAIL.filter((id) => id !== "finish-matt");
    const r = validateOrder({ lineSlug: "off-road", componentIds: ids, expectedTotalCents: totalFor(ids) }, catalog);
    expect(r.errors.find((e) => e.code === "incomplete_build")).toMatchObject({ missing: ["finish_type"] });
  });
});

describe("tamper: bad extras", () => {
  it("rejects an unknown extra id", () => {
    const r = validateOrder(order({ extraIds: [...APEX_EXTRAS, "extra-bogus"] }), catalog);
    expect(r.errors.find((e) => e.code === "unknown_extra")).toMatchObject({ extraId: "extra-bogus" });
  });

  it("rejects an extra from another product line", () => {
    const foreignExtra = { ...catalog.extras[0], id: "extra-foreign", lineId: "line-other" };
    const tampered: Catalog = { ...catalog, extras: [...catalog.extras, foreignExtra] };
    const r = validateOrder(order({ extraIds: ["extra-foreign"], expectedTotalCents: correct }), tampered);
    expect(r.errors.find((e) => e.code === "foreign_line_extra")).toMatchObject({ extraId: "extra-foreign" });
  });

  it("rejects a frame-incompatible extra", () => {
    const htOnly = { ...catalog.extras[0], id: "extra-ht-only", compatibleFrameTypes: ["hardtail" as const] };
    const tampered: Catalog = { ...catalog, extras: [...catalog.extras, htOnly] };
    // Apex is full-suspension, so a hardtail-only extra must be rejected.
    const r = validateOrder(order({ extraIds: ["extra-ht-only"], expectedTotalCents: correct }), tampered);
    expect(r.errors.find((e) => e.code === "extra_frame_incompatible")).toMatchObject({ extraId: "extra-ht-only" });
  });

  it("rejects foot pegs on a mid-drive motor (mid-drive requires pedals)", () => {
    const ids = ["chassis-fullsus", "wheel-29", "frame-m", "fork-coil-100", "motor-tsdz8", "battery-downtube-48", "brakes-mechanical", "disc-180", "tyres-mtb", "bar-flat", "seatpost-rigid", "foot-pegs", "colour-stealth", "accent-black", "finish-matt"];
    const r = validateOrder({ lineSlug: "off-road", componentIds: ids, expectedTotalCents: totalFor(ids) }, catalog);
    expect(r.ok).toBe(false);
    expect(incompatReasons(r).some((x) => /pedals|hub/i.test(x))).toBe(true);
  });
});

describe("tamper: stale prices", () => {
  it("rejects an order priced against an outdated catalog and returns the new total", () => {
    const bump = 12000;
    const stale: Catalog = {
      ...catalog,
      components: catalog.components.map((c) => (c.id === "motor-tsdz16" ? { ...c, priceDeltaCents: c.priceDeltaCents + bump } : c)),
    };
    const r = validateOrder(order({ expectedTotalCents: correct }), stale);
    expect(r.errors).toEqual([{ code: "price_mismatch", expectedCents: correct, actualCents: correct + bump }]);
    expect(r.totalCents).toBe(correct + bump);
  });
});

describe("line resolution", () => {
  it("rejects a checkout aimed at a different line", () => {
    expect(codes(validateOrder(order({ lineSlug: "street-legal" }), catalog))).toEqual(["unknown_line"]);
  });
});
