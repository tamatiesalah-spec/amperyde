import { describe, expect, it } from "vitest";
import { offRoadCatalog } from "@/data/seed/offRoad";
import {
  applyChange,
  buildContext,
  checkCandidate,
  optionsForCategory,
  resolvedVoltage,
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

describe("frame-type gating", () => {
  it("allows a hub motor on a hardtail chassis", () => {
    const sel: Selection = { chassis: "chassis-hardtail-alu" };
    expect(checkCandidate(comp("motor-hub-1000"), sel, ctx).ok).toBe(true);
  });

  it("blocks a hub motor on a full-suspension chassis (hub-only-on-hardtail)", () => {
    const sel: Selection = { chassis: "chassis-fullsus-alu" };
    const res = checkCandidate(comp("motor-hub-1000"), sel, ctx);
    expect(res.ok).toBe(false);
    expect(res.reasons[0]).toMatch(/hardtail/i);
  });

  it("blocks mullet wheels on a hardtail chassis", () => {
    const sel: Selection = { chassis: "chassis-hardtail-alu" };
    expect(checkCandidate(comp("wheels-mullet"), sel, ctx).ok).toBe(false);
  });

  it("blocks choosing full-suspension while a hub motor is selected", () => {
    const sel: Selection = { motor: "motor-hub-1000" };
    expect(checkCandidate(comp("chassis-fullsus-carbon"), sel, ctx).ok).toBe(false);
  });
});

describe("voltage matching", () => {
  it("resolves voltage from the selected motor", () => {
    expect(resolvedVoltage({ motor: "motor-mid-5000" }, ctx)).toBe(72);
    expect(resolvedVoltage({}, ctx)).toBeUndefined();
  });

  it("blocks a mismatched battery", () => {
    const sel: Selection = { motor: "motor-mid-5000" }; // 72V
    expect(checkCandidate(comp("battery-48-20"), sel, ctx).ok).toBe(false);
    expect(checkCandidate(comp("battery-72-40"), sel, ctx).ok).toBe(true);
  });
});

describe("explicit incompatibility table", () => {
  it("blocks supermoto wheels with 2-piston brakes, both directions", () => {
    expect(checkCandidate(comp("brakes-2piston"), { wheels: "wheels-supermoto" }, ctx).ok).toBe(false);
    expect(checkCandidate(comp("wheels-supermoto"), { brakes: "brakes-2piston" }, ctx).ok).toBe(false);
  });

  it("allows supermoto wheels with 4-piston brakes", () => {
    expect(checkCandidate(comp("brakes-4piston"), { wheels: "wheels-supermoto" }, ctx).ok).toBe(true);
  });
});

describe("applyChange cascade", () => {
  it("auto-resolves the battery when the motor changes", () => {
    const start: Selection = { motor: "motor-hub-1000", battery: "battery-48-20" };
    const { selection, changes } = applyChange(start, "motor", "motor-mid-5000", ctx);
    expect(selection.battery).toBe("battery-72-40");
    expect(changes.some((c) => c.category === "battery")).toBe(true);
  });

  it("auto-selects a matching battery even if none was chosen yet", () => {
    const { selection } = applyChange({}, "motor", "motor-mid-3000", ctx);
    expect(selection.battery).toBe("battery-60-30");
  });

  it("drops an invalidated hub motor when switching to full-suspension", () => {
    const start: Selection = {
      chassis: "chassis-hardtail-alu",
      motor: "motor-hub-1000",
      battery: "battery-48-20",
    };
    const { selection, changes } = applyChange(start, "chassis", "chassis-fullsus-alu", ctx);
    expect(selection.motor).toBeUndefined();
    expect(changes.some((c) => c.category === "motor" && c.to === undefined)).toBe(true);
  });

  it("keeps earlier selections when changing a later category", () => {
    const start: Selection = { chassis: "chassis-hardtail-alu", wheels: "wheels-knobby" };
    const { selection } = applyChange(start, "wheels", "wheels-dualsport", ctx);
    expect(selection.chassis).toBe("chassis-hardtail-alu");
    expect(selection.wheels).toBe("wheels-dualsport");
  });
});

describe("revalidateBuild", () => {
  it("keeps a valid preset build unchanged (except idempotent battery match)", () => {
    const sel = selectionFromComponentIds(
      offRoadCatalog.presets[2].componentIds, // Apex
      ctx,
    );
    const { selection } = revalidateBuild(sel, ctx);
    for (const cat of CATEGORY_ORDER) expect(selection[cat]).toBe(sel[cat]);
  });

  it("drops later conflicts, chassis wins", () => {
    // Full-suspension chassis but a hub motor: motor must be dropped.
    const bad: Selection = {
      chassis: "chassis-fullsus-alu",
      motor: "motor-hub-1000",
    };
    const { selection } = revalidateBuild(bad, ctx);
    expect(selection.chassis).toBe("chassis-fullsus-alu");
    expect(selection.motor).toBeUndefined();
  });
});

describe("optionsForCategory", () => {
  it("annotates incompatible options without removing them", () => {
    const opts = optionsForCategory("motor", { chassis: "chassis-fullsus-alu" }, ctx);
    const hub = opts.find((o) => o.component.id === "motor-hub-1000");
    const mid = opts.find((o) => o.component.id === "motor-mid-3000");
    expect(hub?.result.ok).toBe(false);
    expect(mid?.result.ok).toBe(true);
    expect(opts).toHaveLength(ctx.byCategory.get("motor")!.length);
  });

  it("gates a step only by EARLIER categories, not later conflicts", () => {
    // Full default build (hub motor selected). At the chassis step, every
    // chassis must remain selectable — the hub motor is a LATER category and is
    // handled by the cascade, not by disabling the current step.
    const full: Selection = {
      chassis: "chassis-hardtail-alu",
      motor: "motor-hub-1000",
      battery: "battery-48-20",
    };
    const chassisOpts = optionsForCategory("chassis", full, ctx);
    expect(chassisOpts.every((o) => o.result.ok)).toBe(true);
  });
});

describe("selectedFrameType", () => {
  it("reads the frame type from the chosen chassis", () => {
    expect(selectedFrameType({ chassis: "chassis-fullsus-carbon" }, ctx)).toBe("full_suspension");
    expect(selectedFrameType({}, ctx)).toBeUndefined();
  });
});
