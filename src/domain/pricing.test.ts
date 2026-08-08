import { describe, expect, it } from "vitest";
import { offRoadCatalog } from "@/data/seed/offRoad";
import { buildContext, selectionFromComponentIds } from "@/domain/compatibility";
import { formatUsd, priceSelection } from "@/domain/pricing";

const ctx = buildContext(offRoadCatalog.components, offRoadCatalog.incompatibilities);
const line = offRoadCatalog.line;

describe("priceSelection", () => {
  it("returns just the base price for an empty selection", () => {
    const p = priceSelection(line, {}, ctx);
    expect(p.totalCents).toBe(line.basePriceCents);
    expect(p.lineItems).toHaveLength(0);
  });

  it("adds component deltas to the base price", () => {
    // Base + carbon hardtail (+90000) + dual-sport (+18000).
    const p = priceSelection(
      line,
      { chassis: "chassis-hardtail-carbon", wheels: "wheels-dualsport" },
      ctx,
    );
    expect(p.totalCents).toBe(line.basePriceCents + 90000 + 18000);
    expect(p.lineItems).toHaveLength(2);
  });

  it("prices the Trailhead preset as the pure base build", () => {
    const sel = selectionFromComponentIds(offRoadCatalog.presets[0].componentIds, ctx);
    expect(priceSelection(line, sel, ctx).totalCents).toBe(490000);
  });

  it("prices the Apex preset at the expected flagship total", () => {
    const sel = selectionFromComponentIds(offRoadCatalog.presets[2].componentIds, ctx);
    // 490000 + 260000 + 32000 + 240000 + 150000 + 38000 + 22000 + 45000
    expect(priceSelection(line, sel, ctx).totalCents).toBe(1277000);
  });
});

describe("formatUsd", () => {
  it("formats integer cents as whole-dollar USD", () => {
    expect(formatUsd(490000)).toBe("$4,900");
    expect(formatUsd(1277000)).toBe("$12,770");
  });
});
