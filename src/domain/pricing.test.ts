import { describe, expect, it } from "vitest";
import { offRoadCatalog } from "@/data/seed/offRoad";
import { buildContext, selectionFromComponentIds } from "@/domain/compatibility";
import { formatMoney, priceSelection } from "@/domain/pricing";

const ctx = buildContext(offRoadCatalog.components, offRoadCatalog.incompatibilities);
const line = offRoadCatalog.line;
const extrasCtx = (selectedIds: string[]) => ({ all: offRoadCatalog.extras, selectedIds });

describe("priceSelection", () => {
  it("returns just the base price for an empty selection", () => {
    const p = priceSelection(line, {}, ctx);
    expect(p.totalCents).toBe(line.basePriceCents);
    expect(p.componentItems).toHaveLength(0);
    expect(p.currency).toBe("EUR");
  });

  it("adds component deltas to the base price", () => {
    // Full-suspension (+120000) + mullet wheels (+12000).
    const p = priceSelection(line, { chassis: "chassis-fullsus", wheel_size: "wheel-mullet" }, ctx);
    expect(p.totalCents).toBe(line.basePriceCents + 120000 + 12000);
    expect(p.componentItems).toHaveLength(2);
  });

  it("prices the Trailhead preset as the pure base build (all defaults)", () => {
    const sel = selectionFromComponentIds(offRoadCatalog.presets[0].componentIds, ctx);
    expect(priceSelection(line, sel, ctx).totalCents).toBe(line.basePriceCents);
  });

  it("adds selected extras on top of the components", () => {
    const sel = selectionFromComponentIds(offRoadCatalog.presets[2].componentIds, ctx); // Apex
    const componentsOnly = priceSelection(line, sel, ctx).totalCents;
    const withExtras = priceSelection(line, sel, ctx, extrasCtx(["extra-lights", "extra-street-legal-kit"]));
    expect(withExtras.totalCents).toBe(componentsOnly + 9000 + 45000);
    expect(withExtras.extraItems).toHaveLength(2);
  });

  it("ignores unknown extra ids in the price", () => {
    const p = priceSelection(line, {}, ctx, extrasCtx(["extra-lights", "does-not-exist"]));
    expect(p.totalCents).toBe(line.basePriceCents + 9000);
    expect(p.extraItems).toHaveLength(1);
  });

  it("prices the Apex preset (components + preset extras) as expected", () => {
    const sel = selectionFromComponentIds(offRoadCatalog.presets[2].componentIds, ctx);
    const p = priceSelection(line, sel, ctx, extrasCtx(offRoadCatalog.presets[2].extraIds ?? []));
    // components 499000 + extras (fairings 35000 + lights 9000 + street-legal 45000)
    expect(p.totalCents).toBe(499000 + 89000);
  });
});

describe("formatMoney", () => {
  it("formats integer cents as whole-euro amounts", () => {
    expect(formatMoney(200000, "EUR")).toBe("€2,000");
    expect(formatMoney(588000, "EUR")).toBe("€5,880");
  });
});
