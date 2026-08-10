// Guided-flow orchestration helpers on top of the compatibility engine.

import { CATEGORY_ORDER, type Selection } from "@/domain/types";
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
