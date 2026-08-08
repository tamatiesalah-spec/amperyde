// Guided-flow orchestration helpers on top of the compatibility engine.

import { CATEGORY_ORDER, type Category, type Selection } from "@/domain/types";
import { defaultFor, type CompatContext } from "@/domain/compatibility";

/** A complete, valid base build: the default option in every category. */
export function defaultSelection(ctx: CompatContext): Selection {
  const selection: Selection = {};
  for (const cat of CATEGORY_ORDER) {
    const def = defaultFor(cat, ctx);
    if (def) selection[cat] = def.id;
  }
  return selection;
}

/** First category in guided order that has no selection, or null if complete. */
export function firstIncompleteCategory(selection: Selection): Category | null {
  for (const cat of CATEGORY_ORDER) {
    if (!selection[cat]) return cat;
  }
  return null;
}

export function categoryIndex(category: Category): number {
  return CATEGORY_ORDER.indexOf(category);
}

export function nextCategory(category: Category): Category | null {
  const i = CATEGORY_ORDER.indexOf(category);
  return i >= 0 && i < CATEGORY_ORDER.length - 1 ? CATEGORY_ORDER[i + 1] : null;
}

export function prevCategory(category: Category): Category | null {
  const i = CATEGORY_ORDER.indexOf(category);
  return i > 0 ? CATEGORY_ORDER[i - 1] : null;
}
