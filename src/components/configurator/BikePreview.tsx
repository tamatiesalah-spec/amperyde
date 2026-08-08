"use client";

// Preview panel: the layered bike composite plus contextual chrome (live-preview
// note, frame badge, and the current selection caption). The composite itself
// handles layer stacking, real-time swaps, and the zoom/pan into each region.

import {
  CATEGORY_LABELS,
  FRAME_TYPE_LABELS,
  type Category,
  type Selection,
} from "@/domain/types";
import { selectedFrameType, type CompatContext } from "@/domain/compatibility";
import { BikeComposite } from "./BikeComposite";

interface Props {
  selection: Selection;
  currentCategory: Category;
  ctx: CompatContext;
  onSelectCategory: (category: Category) => void;
}

export function BikePreview({ selection, currentCategory, ctx, onSelectCategory }: Props) {
  const frame = selectedFrameType(selection, ctx);
  const currentComp = selection[currentCategory]
    ? ctx.byId.get(selection[currentCategory]!)
    : undefined;

  return (
    <div className="relative flex h-full flex-col">
      <div className="pointer-events-none absolute left-5 top-5 z-10">
        <p className="eyebrow">Live preview</p>
        <p className="mt-1 text-xs text-faint">Placeholder art — swaps to photography per category</p>
      </div>

      {frame && (
        <div className="absolute right-5 top-5 z-10 rounded-full border border-line bg-surface-2/80 px-3 py-1 text-xs font-medium text-muted backdrop-blur">
          {FRAME_TYPE_LABELS[frame]}
        </div>
      )}

      <div className="min-h-0 flex-1">
        <BikeComposite
          selection={selection}
          currentCategory={currentCategory}
          ctx={ctx}
          onSelectCategory={onSelectCategory}
        />
      </div>

      <div className="border-t border-line px-6 py-4">
        <p className="eyebrow">{CATEGORY_LABELS[currentCategory]}</p>
        <p className="mt-1 text-lg font-medium">
          {currentComp ? currentComp.name : "Not selected"}
        </p>
        {currentComp?.description && (
          <p className="mt-0.5 text-sm text-muted">{currentComp.description}</p>
        )}
      </div>
    </div>
  );
}
