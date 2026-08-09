import { describe, expect, it } from "vitest";
import { offRoadCatalog } from "@/data/seed/offRoad";
import { buildContext, selectionFromComponentIds } from "@/domain/compatibility";
import { priceSelection } from "@/domain/pricing";
import { revalidateOrder } from "@/server/revalidateOrder";

// Integration: the async entry loads the catalog through the repository, then
// delegates to the pure validateOrder guard (unit-tested in checkout.test.ts).

const ctx = buildContext(offRoadCatalog.components, offRoadCatalog.incompatibilities);
const apex = offRoadCatalog.presets.find((p) => p.name === "Apex")!.componentIds;
const apexTotal = priceSelection(offRoadCatalog.line, selectionFromComponentIds(apex, ctx), ctx).totalCents;

describe("revalidateOrder (repository-backed)", () => {
  it("accepts a valid order loaded from the repository", async () => {
    const r = await revalidateOrder({ lineSlug: "off-road", componentIds: apex, expectedTotalCents: apexTotal });
    expect(r.ok).toBe(true);
    expect(r.totalCents).toBe(apexTotal);
  });

  it("rejects an unknown line without throwing", async () => {
    const r = await revalidateOrder({ lineSlug: "street-legal", componentIds: apex, expectedTotalCents: apexTotal });
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual([{ code: "unknown_line", lineSlug: "street-legal" }]);
  });

  it("rejects a tampered total end-to-end", async () => {
    const r = await revalidateOrder({ lineSlug: "off-road", componentIds: apex, expectedTotalCents: apexTotal - 25000 });
    expect(r.ok).toBe(false);
    expect(r.errors.map((e) => e.code)).toContain("price_mismatch");
  });
});
