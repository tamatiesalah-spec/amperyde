import { describe, expect, it } from "vitest";
import { offRoadCatalog } from "@/data/seed/offRoad";
import { buildContext, validateBuild } from "@/domain/compatibility";
import { defaultSelection } from "@/domain/configurator";
import { CATEGORY_ORDER } from "@/domain/types";

const ctx = buildContext(offRoadCatalog.components, offRoadCatalog.incompatibilities);

describe("defaultSelection", () => {
  it("selects the default option in every category", () => {
    const sel = defaultSelection(ctx);
    for (const cat of CATEGORY_ORDER) {
      expect(sel[cat], cat).toBeDefined();
      expect(ctx.byId.get(sel[cat]!)?.isDefault, cat).toBe(true);
    }
  });

  it("produces a complete, valid base build", () => {
    const v = validateBuild(defaultSelection(ctx), ctx);
    expect(v.complete).toBe(true);
    expect(v.valid).toBe(true);
  });
});
