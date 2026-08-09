"use client";

// Layered composite of the bike: one image layer per component category,
// stacked and z-ordered, each swappable in real time. Selecting an option swaps
// only that layer. Changing step animates a zoom/pan into that category's
// region via a CSS transform on the stage (not a re-render) — the target
// transform is written to inline style immediately and CSS eases it.
//
// Layers load from each component's (source-agnostic) asset reference; a
// missing/failed asset falls back to procedurally-drawn placeholder art so the
// composite stays coherent while imagery is migrated category-by-category.

import { useState } from "react";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type Category,
  type Component,
  type Selection,
} from "@/domain/types";
import type { CompatContext } from "@/domain/compatibility";
import { resolveAssetUrl } from "@/lib/assets";
import { FOCUS_REGIONS, LAYER_Z, VIEWBOX, layerDataUri } from "@/lib/bikeArt";

interface Props {
  selection: Selection;
  currentCategory: Category;
  ctx: CompatContext;
  onSelectCategory: (category: Category) => void;
}

// Categories shown "full bike" — hotspots visible, gentle zoom.
const OVERVIEW: ReadonlySet<Category> = new Set<Category>([
  "chassis",
  "frame_size",
  "main_colour",
  "accent_colour",
  "finish_type",
]);

export function BikeComposite({ selection, currentCategory, ctx, onSelectCategory }: Props) {
  const region = FOCUS_REGIONS[currentCategory];

  // Fit the focus region within the frame, then center it. Transform math:
  // screen = W * (t + s * p); solve for t so the region centre lands at 0.5.
  const scale = Math.min(VIEWBOX.w / region.w, VIEWBOX.h / region.h, 2.6);
  const nx = (region.x + region.w / 2) / VIEWBOX.w;
  const ny = (region.y + region.h / 2) / VIEWBOX.h;
  const tx = 0.5 - scale * nx;
  const ty = 0.5 - scale * ny;

  const overview = OVERVIEW.has(currentCategory);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="relative aspect-[25/16] w-full max-w-3xl">
          <div
            className="absolute inset-0"
            style={{
              transformOrigin: "0 0",
              transform: `translate(${tx * 100}%, ${ty * 100}%) scale(${scale})`,
              transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {CATEGORY_ORDER.map((cat) => {
              const id = selection[cat];
              const comp = id ? ctx.byId.get(id) : undefined;
              if (!comp) return null;
              return (
                <AssetLayer
                  key={cat}
                  category={cat}
                  comp={comp}
                  z={LAYER_Z[cat]}
                  dimmed={!overview && cat !== currentCategory}
                />
              );
            })}
          </div>

          {/* Navigation hotspots — only in the full-bike overview. */}
          {overview &&
            CATEGORY_ORDER.filter((c) => !OVERVIEW.has(c)).map((cat) => {
              const r = FOCUS_REGIONS[cat];
              const cx = ((r.x + r.w / 2) / VIEWBOX.w) * 100;
              const cy = ((r.y + r.h / 2) / VIEWBOX.h) * 100;
              const comp = selection[cat] ? ctx.byId.get(selection[cat]!) : undefined;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelectCategory(cat)}
                  style={{ left: `${cx}%`, top: `${cy}%` }}
                  className="group absolute -translate-x-1/2 -translate-y-1/2"
                  aria-label={`${CATEGORY_LABELS[cat]}${comp ? `: ${comp.name}` : ""}`}
                >
                  <span className="block h-3 w-3 rounded-full bg-brand/80 ring-4 ring-brand/15 transition group-hover:bg-brand" />
                  <span className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded border border-line bg-surface-2/90 px-1.5 py-0.5 text-[10px] text-muted opacity-0 backdrop-blur transition group-hover:opacity-100">
                    {CATEGORY_LABELS[cat]}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function AssetLayer({
  category,
  comp,
  z,
  dimmed,
}: {
  category: Category;
  comp: Component;
  z: number;
  dimmed: boolean;
}) {
  const primary = resolveAssetUrl(comp.layerAsset);
  const [failed, setFailed] = useState(false);
  const src = failed || !primary ? layerDataUri(category, comp) : primary;

  return (
    <img
      // Keyed by component id so a selection change mounts the new layer art.
      key={comp.id}
      src={src}
      alt=""
      draggable={false}
      onError={() => setFailed(true)}
      className="pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-300"
      style={{ zIndex: z, opacity: dimmed ? 0.32 : 1 }}
    />
  );
}
