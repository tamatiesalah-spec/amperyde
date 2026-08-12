import { describe, expect, it } from "vitest";
import { offRoadCatalog } from "@/data/seed/offRoad";
import { buildContext, selectionFromComponentIds } from "@/domain/compatibility";
import { priceSelection } from "@/domain/pricing";
import { revalidateOrder } from "@/server/revalidateOrder";

// Integration: the async entry loads the catalog through the repository, then
// delegates to the pure validateOrder guard (unit-tested in checkout.test.ts).
// Trailhead is hardtail (purchasable); Apex is full-suspension (coming soon).

const ctx = buildContext(offRoadCatalog.components, offRoadCatalog.incompatibilities);
const trail = offRoadCatalog.presets.find((p) => p.name === "Trailhead")!;
const extraIds = ["extra-lights"];
const trailTotal = priceSelection(offRoadCatalog.line, selectionFromComponentIds(trail.componentIds, ctx), ctx, {
  all: offRoadCatalog.extras,
  selectedIds: extraIds,
}).totalCents;

describe("revalidateOrder (repository-backed)", () => {
  it("accepts a valid order (with extras) loaded from the repository", async () => {
    const r = await revalidateOrder({
      lineSlug: "off-road",
      componentIds: trail.componentIds,
      extraIds,
      expectedTotalCents: trailTotal,
    });
    expect(r.ok).toBe(true);
    expect(r.totalCents).toBe(trailTotal);
  });

  it("rejects an unknown line without throwing", async () => {
    const r = await revalidateOrder({ lineSlug: "street-legal", componentIds: trail.componentIds, expectedTotalCents: trailTotal });
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual([{ code: "unknown_line", lineSlug: "street-legal" }]);
  });

  it("rejects a tampered total end-to-end", async () => {
    const r = await revalidateOrder({
      lineSlug: "off-road",
      componentIds: trail.componentIds,
      extraIds,
      expectedTotalCents: trailTotal - 25000,
    });
    expect(r.ok).toBe(false);
    expect(r.errors.map((e) => e.code)).toContain("price_mismatch");
  });
});
