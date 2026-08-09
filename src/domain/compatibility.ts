// Compatibility engine — pure, data-driven. Reasons about a Selection using
// component ATTRIBUTES (frame types, motor type, voltage) plus an explicit
// incompatibility table. No component ids are hardcoded here.
//
// Rules enforced:
//   1. Frame-type gating — a component's compatibleFrameTypes must include the
//      selected chassis frame type. (Hub motors carry ['hardtail'], so this one
//      rule delivers "hub motors only on hardtail chassis".)
//   2. Voltage matching — the battery voltage must equal the selected motor's
//      voltage. Handled for display here; auto-resolved in applyChange().
//   3. Explicit incompatibilities — arbitrary gated pairs from the catalog.

import {
  CATEGORY_ORDER,
  FRAME_TYPE_LABELS,
  type Category,
  type Component,
  type FrameType,
  type IncompatibilityRule,
  type Selection,
} from "@/domain/types";

export interface CompatContext {
  byId: Map<string, Component>;
  byCategory: Map<Category, Component[]>;
  incompatibilities: IncompatibilityRule[];
}

export function buildContext(
  components: Component[],
  incompatibilities: IncompatibilityRule[],
): CompatContext {
  const byId = new Map<string, Component>();
  const byCategory = new Map<Category, Component[]>();
  for (const cat of CATEGORY_ORDER) byCategory.set(cat, []);
  for (const comp of components) {
    byId.set(comp.id, comp);
    byCategory.get(comp.category)?.push(comp);
  }
  for (const list of byCategory.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return { byId, byCategory, incompatibilities };
}

export interface CompatResult {
  ok: boolean;
  reasons: string[];
}

const OK: CompatResult = { ok: true, reasons: [] };

/** Frame type of the selected chassis, if any. */
export function selectedFrameType(
  selection: Selection,
  ctx: CompatContext,
): FrameType | undefined {
  const id = selection.chassis;
  return id ? ctx.byId.get(id)?.frameType : undefined;
}

/** Voltage implied by the selected motor ("auto-resolves from motor selection"). */
export function resolvedVoltage(
  selection: Selection,
  ctx: CompatContext,
): number | undefined {
  const id = selection.motor;
  return id ? ctx.byId.get(id)?.voltage : undefined;
}

function selectedComponents(
  selection: Selection,
  ctx: CompatContext,
  exclude?: Category,
): Component[] {
  const out: Component[] = [];
  for (const cat of CATEGORY_ORDER) {
    if (cat === exclude) continue;
    const id = selection[cat];
    if (!id) continue;
    const comp = ctx.byId.get(id);
    if (comp) out.push(comp);
  }
  return out;
}

/**
 * Check whether `candidate` is compatible with everything currently selected
 * (its own category is ignored, since choosing it replaces that slot).
 */
export function checkCandidate(
  candidate: Component,
  selection: Selection,
  ctx: CompatContext,
): CompatResult {
  const reasons: string[] = [];
  const others = selectedComponents(selection, ctx, candidate.category);
  const selectedChassis = others.find((c) => c.category === "chassis");

  // 1. Frame-type gating.
  if (candidate.category === "chassis") {
    // Choosing a chassis: every already-selected component must accept its frame.
    for (const other of others) {
      if (
        other.compatibleFrameTypes &&
        candidate.frameType &&
        !other.compatibleFrameTypes.includes(candidate.frameType)
      ) {
        reasons.push(frameReason(other, candidate.frameType));
      }
    }
  } else if (
    candidate.compatibleFrameTypes &&
    selectedChassis?.frameType &&
    !candidate.compatibleFrameTypes.includes(selectedChassis.frameType)
  ) {
    reasons.push(frameReason(candidate, selectedChassis.frameType));
  }

  // 1b. Motor-type gating (e.g. foot pegs need a hub motor; mid-drives need
  //     pedals to function). Mirrors frame gating, keyed on the motor drive type.
  const selectedMotor = others.find((c) => c.category === "motor");
  if (candidate.category === "motor") {
    for (const other of others) {
      if (other.compatibleMotorTypes && candidate.motorType && !other.compatibleMotorTypes.includes(candidate.motorType)) {
        reasons.push(motorTypeReason(other));
      }
    }
  } else if (candidate.compatibleMotorTypes && selectedMotor?.motorType && !candidate.compatibleMotorTypes.includes(selectedMotor.motorType)) {
    reasons.push(motorTypeReason(candidate));
  }

  // 2. Voltage compatibility — a battery's voltage must be one the selected
  //    motor's controller accepts. Wrong voltage into a controller is a hardware
  //    safety issue (overvoltage can destroy it), so this is a hard gate.
  if (candidate.category === "battery" && candidate.voltage != null) {
    const motor = others.find((c) => c.category === "motor");
    if (motor?.acceptedVoltages && !motor.acceptedVoltages.includes(candidate.voltage)) {
      reasons.push(`This motor accepts ${fmtVolts(motor.acceptedVoltages)}; a ${candidate.voltage}V battery won’t work.`);
    }
  } else if (candidate.category === "motor" && candidate.acceptedVoltages) {
    const battery = others.find((c) => c.category === "battery");
    if (battery?.voltage != null && !candidate.acceptedVoltages.includes(battery.voltage)) {
      reasons.push(`This motor accepts ${fmtVolts(candidate.acceptedVoltages)}; the selected ${battery.voltage}V battery won’t work.`);
    }
  }

  // 3. Explicit incompatibility table.
  const selectedIds = new Set(others.map((c) => c.id));
  for (const rule of ctx.incompatibilities) {
    const paired =
      rule.a === candidate.id ? rule.b : rule.b === candidate.id ? rule.a : null;
    if (paired && selectedIds.has(paired)) reasons.push(rule.reason);
  }

  return reasons.length === 0 ? OK : { ok: false, reasons };
}

function fmtVolts(volts: number[]): string {
  const list = [...volts].sort((a, b) => a - b).map((v) => `${v}V`);
  return list.length <= 1 ? (list[0] ?? "") : `${list.slice(0, -1).join(", ")} or ${list[list.length - 1]}`;
}

function motorTypeReason(component: Component): string {
  if (component.category === "pedals") {
    return "Mid-drive motors require pedals; foot pegs are only available with a hub motor.";
  }
  return `${component.name} isn’t available with the selected motor.`;
}

function frameReason(component: Component, frame: FrameType): string {
  if (component.category === "motor" && component.motorType === "hub") {
    return "Hub motors require a hardtail frame.";
  }
  return `${component.name} isn’t available on a ${FRAME_TYPE_LABELS[frame]} frame.`;
}

export interface AnnotatedOption {
  component: Component;
  result: CompatResult;
  isSelected: boolean;
}

/**
 * All options in a category, annotated for the guided flow. Selectability is
 * gated by EARLIER categories only (chassis -> ... -> finish): choosing an
 * option is always honored, and any resulting conflict in a LATER category is
 * resolved by applyChange's cascade rather than by disabling the current step.
 */
export function optionsForCategory(
  category: Category,
  selection: Selection,
  ctx: CompatContext,
): AnnotatedOption[] {
  const idx = CATEGORY_ORDER.indexOf(category);
  const priorSelection: Selection = {};
  for (let i = 0; i < idx; i++) {
    const cat = CATEGORY_ORDER[i];
    if (selection[cat]) priorSelection[cat] = selection[cat];
  }

  const list = ctx.byCategory.get(category) ?? [];
  return list.map((component) => ({
    component,
    result: checkCandidate(component, priorSelection, ctx),
    isSelected: selection[category] === component.id,
  }));
}

export function defaultFor(
  category: Category,
  ctx: CompatContext,
): Component | undefined {
  const list = ctx.byCategory.get(category) ?? [];
  return list.find((c) => c.isDefault) ?? list[0];
}

export interface SelectionChange {
  category: Category;
  from?: string;
  to?: string;
  reason: string;
}

export interface ChangeResult {
  selection: Selection;
  changes: SelectionChange[];
}

/**
 * Auto-select a battery the selected motor's controller can safely accept (the
 * "voltage auto-resolves from motor selection" behaviour). Picks the first
 * fully-compatible battery — frame AND accepted voltage — preferring the default
 * pack. Mutates `selection`.
 */
function autoResolveBattery(
  selection: Selection,
  ctx: CompatContext,
  changes: SelectionChange[],
): void {
  const motorId = selection.motor;
  if (!motorId) return;
  const accepted = ctx.byId.get(motorId)?.acceptedVoltages;
  if (!accepted) return;

  const current = selection.battery ? ctx.byId.get(selection.battery) : undefined;
  // Already valid against the motor (voltage) and everything else (frame, etc.)?
  if (current && checkCandidate(current, selection, ctx).ok) return;

  const batteries = ctx.byCategory.get("battery") ?? [];
  const def = batteries.find((b) => b.isDefault);
  const ordered = def ? [def, ...batteries.filter((b) => b !== def)] : batteries;
  const match = ordered.find((b) => checkCandidate(b, selection, ctx).ok);

  if (match) {
    if (selection.battery !== match.id) {
      const from = selection.battery;
      selection.battery = match.id;
      changes.push({
        category: "battery",
        from,
        to: match.id,
        reason: `Auto-matched to a ${match.voltage}V pack the motor supports.`,
      });
    }
  } else if (selection.battery) {
    const from = selection.battery;
    delete selection.battery;
    changes.push({
      category: "battery",
      from,
      to: undefined,
      reason: "No compatible battery for this motor.",
    });
  }
}

/**
 * Apply a user's explicit choice, honoring it, then cascade: auto-resolve the
 * battery voltage and re-validate every category AFTER the changed one, dropping
 * (or defaulting) any selection the change invalidated. Earlier choices win —
 * matching the guided chassis -> ... -> finish order.
 */
export function applyChange(
  selection: Selection,
  category: Category,
  componentId: string,
  ctx: CompatContext,
): ChangeResult {
  const next: Selection = { ...selection, [category]: componentId };
  const changes: SelectionChange[] = [];

  autoResolveBattery(next, ctx, changes);

  const startIdx = CATEGORY_ORDER.indexOf(category);
  for (const cat of CATEGORY_ORDER.slice(startIdx + 1)) {
    const id = next[cat];
    if (!id) continue;
    const comp = ctx.byId.get(id);
    if (!comp) {
      delete next[cat];
      continue;
    }
    const res = checkCandidate(comp, next, ctx);
    if (res.ok) continue;

    const fallback = defaultFor(cat, ctx);
    if (fallback && fallback.id !== id && checkCandidate(fallback, next, ctx).ok) {
      next[cat] = fallback.id;
      changes.push({ category: cat, from: id, to: fallback.id, reason: res.reasons[0] });
    } else {
      delete next[cat];
      changes.push({ category: cat, from: id, to: undefined, reason: res.reasons[0] });
    }
    autoResolveBattery(next, ctx, changes);
  }

  return { selection: next, changes };
}

/**
 * Re-validate a whole build with no anchor (e.g. after loading a preset or an
 * external build). Earlier categories in CATEGORY_ORDER win; later ones that
 * conflict are dropped. Also auto-resolves battery voltage.
 */
export function revalidateBuild(
  selection: Selection,
  ctx: CompatContext,
): ChangeResult {
  const next: Selection = {};
  const changes: SelectionChange[] = [];

  for (const cat of CATEGORY_ORDER) {
    const id = selection[cat];
    if (!id) continue;
    const comp = ctx.byId.get(id);
    if (!comp) {
      changes.push({ category: cat, from: id, to: undefined, reason: "Unknown component." });
      continue;
    }
    const res = checkCandidate(comp, next, ctx);
    if (res.ok) {
      next[cat] = id;
    } else {
      changes.push({ category: cat, from: id, to: undefined, reason: res.reasons[0] });
    }
    autoResolveBattery(next, ctx, changes);
  }

  return { selection: next, changes };
}

export interface BuildValidity {
  complete: boolean; // every category chosen
  valid: boolean; // every chosen component compatible
  issues: { category: Category; reason: string }[];
}

/** Validate a build. Used for the "ready to build" state and server re-check. */
export function validateBuild(
  selection: Selection,
  ctx: CompatContext,
): BuildValidity {
  const issues: { category: Category; reason: string }[] = [];
  let complete = true;

  for (const cat of CATEGORY_ORDER) {
    const id = selection[cat];
    if (!id) {
      complete = false;
      continue;
    }
    const comp = ctx.byId.get(id);
    if (!comp) {
      issues.push({ category: cat, reason: "Unknown component." });
      continue;
    }
    const res = checkCandidate(comp, selection, ctx);
    if (!res.ok) issues.push({ category: cat, reason: res.reasons[0] });
  }

  return { complete, valid: issues.length === 0, issues };
}

/** The selection encoded by a preset's component ids, keyed by category. */
export function selectionFromComponentIds(
  componentIds: string[],
  ctx: CompatContext,
): Selection {
  const selection: Selection = {};
  for (const id of componentIds) {
    const comp = ctx.byId.get(id);
    if (comp) selection[comp.category] = id;
  }
  return selection;
}
