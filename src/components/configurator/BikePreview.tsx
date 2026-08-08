"use client";

// Placeholder for the future layered-PNG composite + zoom interaction. Renders a
// schematic bike with clickable category hotspots (previewing the "click a region
// on the bike" flow) and the currently selected component per category.

import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  FRAME_TYPE_LABELS,
  type Category,
  type Selection,
} from "@/domain/types";
import type { CompatContext } from "@/domain/compatibility";
import { selectedFrameType } from "@/domain/compatibility";

// Hotspot positions in the 0..100 viewBox space of the schematic.
const HOTSPOTS: Record<Category, { x: number; y: number }> = {
  chassis: { x: 47, y: 48 },
  wheels: { x: 80, y: 70 },
  motor: { x: 26, y: 70 },
  battery: { x: 46, y: 62 },
  brakes: { x: 68, y: 68 },
  cockpit: { x: 71, y: 38 },
  finish: { x: 40, y: 40 },
};

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
      {/* Placeholder banner — real turntable/composite lands in a later pass. */}
      <div className="absolute left-5 top-5 z-10">
        <p className="eyebrow">Live preview</p>
        <p className="mt-1 text-sm text-faint">
          Placeholder composite — layered art & zoom pending
        </p>
      </div>

      {frame && (
        <div className="absolute right-5 top-5 z-10 rounded-full border border-line bg-surface-2/80 px-3 py-1 text-xs font-medium text-muted backdrop-blur">
          {FRAME_TYPE_LABELS[frame]}
        </div>
      )}

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="relative aspect-[4/3] w-full max-w-2xl">
          <svg viewBox="0 0 100 90" className="h-full w-full" role="img" aria-label="Bike schematic">
            <defs>
              <radialGradient id="glow" cx="50%" cy="45%" r="60%">
                <stop offset="0%" stopColor="#d6f24e" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#d6f24e" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="100" height="90" fill="url(#glow)" />

            {/* Wheels */}
            <circle cx="26" cy="70" r="15" className="fill-none stroke-line" strokeWidth="1.5" />
            <circle cx="26" cy="70" r="6" className="fill-none stroke-surface-3" strokeWidth="1" />
            <circle cx="80" cy="70" r="15" className="fill-none stroke-line" strokeWidth="1.5" />
            <circle cx="80" cy="70" r="6" className="fill-none stroke-surface-3" strokeWidth="1" />

            {/* Frame */}
            <g className="stroke-muted" strokeWidth="1.6" strokeLinecap="round" fill="none">
              <path d="M26 70 L50 70 L46 50 L26 70" />
              <path d="M50 70 L66 44 L46 50" />
              <path d="M66 44 L71 40" />
              <path d="M66 44 L80 70" />
              <path d="M46 50 L44 44" />
            </g>
          </svg>

          {/* Hotspots */}
          {CATEGORY_ORDER.map((cat) => {
            const pos = HOTSPOTS[cat];
            const active = cat === currentCategory;
            const chosen = selection[cat] ? ctx.byId.get(selection[cat]!) : undefined;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                style={{ left: `${pos.x}%`, top: `${(pos.y / 90) * 100}%` }}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                aria-label={`${CATEGORY_LABELS[cat]}${chosen ? `: ${chosen.name}` : ""}`}
              >
                <span
                  className={`block h-3.5 w-3.5 rounded-full ring-2 transition ${
                    active
                      ? "bg-volt ring-volt/40"
                      : "bg-surface-3 ring-line group-hover:bg-muted"
                  }`}
                />
                {active && (
                  <span className="absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-surface-2 px-2 py-0.5 text-[11px] text-ink shadow-lg">
                    {CATEGORY_LABELS[cat]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current selection caption */}
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
