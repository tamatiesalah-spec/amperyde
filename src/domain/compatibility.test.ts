import { describe, expect, it } from "vitest";
import { offRoadCatalog } from "@/data/seed/offRoad";
import {
  applyChange,
  buildContext,
  checkCandidate,
  optionsForCategory,
  revalidateBuild,
  selectedFrameType,
  selectionFromComponentIds,
  validateBuild,
} from "@/domain/compatibility";
import { CATEGORY_ORDER, type Selection } from "@/domain/types";

const ctx = buildContext(offRoadCatalog.components, offRoadCatalog.incompatibilities);
const comp = (id: string) => {
  const c = ctx.byId.get(id);
  if (!c) throw new Error(`missing seed component ${id}`);
  return c;
};

describe("seed integrity", () => {
  it("has exactly one default per category", () => {
    for (const cat of CATEGORY_ORDER) {
      const defaults = (ctx.byCategory.get(cat) ?? []).filter((c) => c.isDefault);
      expect(defaults, cat).toHaveLength(1);
    }
  });

  it("every preset is internally compatible and complete", () => {
    for (const preset of offRoadCatalog.presets) {
      const sel = selectionFromComponentIds(preset.componentIds, ctx);
      const validity = validateBuild(sel, ctx);
      expect(validity.complete, `${preset.name} complete`).toBe(true);
      expect(validity.valid, `${preset.name} valid: ${JSON.stringify(validity.issues)}`).toBe(true);
    }
  });
});

describe("frame-type gating (hardtail-only items)", () => {
  it("allows hub motors on a hardtail", () => {
    expect(checkCandidate(comp("motor-hub-1500"), { chassis: "chassis-hardtail" }, ctx).ok).toBe(true);
  });

  it("blocks hub motors on full-suspension", () => {
    const res = checkCandidate(comp("motor-hub-750"), { chassis: "chassis-fullsus" }, ctx);
    expect(res.ok).toBe(false);
    expect(res.reasons[0]).toMatch(/hardtail/i);
  });

  it("blocks triangle batteries on full-suspension", () => {
    expect(checkCandidate(comp("battery-triangle-52"), { chassis: "chassis-fullsus" }, ctx).ok).toBe(false);
  });

  it("blocks the suspension seatpost on full-suspension", () => {
    expect(checkCandidate(comp("seatpost-suspension"), { chassis: "chassis-fullsus" }, ctx).ok).toBe(false);
  });

  it("blocks choosing full-suspension while a hub motor is selected", () => {
    expect(checkCandidate(comp("chassis-fullsus"), { motor: "motor-hub-1000" }, ctx).ok).toBe(false);
  });

  it("allows mullet wheels on either frame (no frame constraint)", () => {
    expect(checkCandidate(comp("wheel-mullet"), { chassis: "chassis-hardtail" }, ctx).ok).toBe(true);
    expect(checkCandidate(comp("wheel-mullet"), { chassis: "chassis-fullsus" }, ctx).ok).toBe(true);
  });
});

describe("no motor/battery voltage coupling", () => {
  it("allows any battery with any motor", () => {
    expect(checkCandidate(comp("battery-downtube-48"), { motor: "motor-tsdz16" }, ctx).ok).toBe(true);
    expect(checkCandidate(comp("battery-downtube-52"), { motor: "motor-hub-750", chassis: "chassis-hardtail" }, ctx).ok).toBe(true);
  });

  it("does not auto-swap the battery when the motor changes", () => {
    const start: Selection = { chassis: "chassis-hardtail", motor: "motor-hub-750", battery: "battery-downtube-48" };
    const { selection } = applyChange(start, "motor", "motor-hub-1500", ctx);
    expect(selection.battery).toBe("battery-downtube-48");
  });
});

describe("applyChange cascade", () => {
  it("drops a hub motor and hardtail-only parts when switching to full-suspension", () => {
    const start: Selection = {
      chassis: "chassis-hardtail",
      motor: "motor-hub-1000",
      battery: "battery-triangle-48",
      seatpost: "seatpost-suspension",
    };
    const { selection } = applyChange(start, "chassis", "chassis-fullsus", ctx);
    // Hub motors have no full-suspension option, so the motor drops entirely.
    expect(selection.motor).toBeUndefined();
    // Battery and seatpost fall back to their (compatible) defaults.
    expect(selection.battery).toBe("battery-downtube-48");
    expect(selection.seatpost).toBe("seatpost-rigid");
  });

  it("keeps earlier selections when changing a later category", () => {
    const start: Selection = { chassis: "chassis-hardtail", tyres: "tyres-mtb" };
    const { selection } = applyChange(start, "tyres", "tyres-supermoto", ctx);
    expect(selection.chassis).toBe("chassis-hardtail");
    expect(selection.tyres).toBe("tyres-supermoto");
  });
});

describe("revalidateBuild", () => {
  it("keeps a valid preset build unchanged", () => {
    const sel = selectionFromComponentIds(offRoadCatalog.presets[2].componentIds, ctx);
    const { selection } = revalidateBuild(sel, ctx);
    for (const cat of CATEGORY_ORDER) expect(selection[cat]).toBe(sel[cat]);
  });

  it("drops later conflicts — chassis wins", () => {
    const bad: Selection = { chassis: "chassis-fullsus", motor: "motor-hub-750" };
    const { selection } = revalidateBuild(bad, ctx);
    expect(selection.chassis).toBe("chassis-fullsus");
    expect(selection.motor).toBeUndefined();
  });
});

describe("optionsForCategory", () => {
  it("gates a step only by earlier categories, not later conflicts", () => {
    const full: Selection = { chassis: "chassis-hardtail", motor: "motor-hub-750" };
    const chassisOpts = optionsForCategory("chassis", full, ctx);
    expect(chassisOpts.every((o) => o.result.ok)).toBe(true);
  });

  it("disables hub motors once a full-suspension chassis is chosen", () => {
    const opts = optionsForCategory("motor", { chassis: "chassis-fullsus" }, ctx);
    expect(opts.find((o) => o.component.id === "motor-hub-750")?.result.ok).toBe(false);
    expect(opts.find((o) => o.component.id === "motor-tsdz8")?.result.ok).toBe(true);
  });
});

describe("selectedFrameType", () => {
  it("reads the frame type from the chosen chassis", () => {
    expect(selectedFrameType({ chassis: "chassis-fullsus" }, ctx)).toBe("full_suspension");
    expect(selectedFrameType({}, ctx)).toBeUndefined();
  });
});
