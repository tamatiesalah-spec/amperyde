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

/**
 * Replace any coming-soon (not-yet-purchasable) selection with the category's
 * default available option. Used when seeding the configurator so it never sits
 * on an unavailable part (e.g. arriving at a coming-soon preset via a direct URL).
 */
export function withAvailableComponents(selection: Selection, ctx: CompatContext): Selection {
  const out: Selection = { ...selection };
  for (const cat of CATEGORY_ORDER) {
    const id = out[cat];
    if (!id) continue;
    if (ctx.byId.get(id)?.comingSoon) {
      const def = defaultFor(cat, ctx);
      if (def && !def.comingSoon) out[cat] = def.id;
      else delete out[cat];
    }
  }
  return out;
}
