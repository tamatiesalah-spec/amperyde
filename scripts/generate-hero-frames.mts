// Generates placeholder hero frames (an "assembly + slow turn + light sweep"
// cinematic) to public/assets/hero/. Throwaway stand-ins for real turntable
// photography / renders — the scroll-scrub mechanism is what matters.
//
// Run: npm run art:hero

import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { offRoadCatalog } from "../src/data/seed/offRoad.ts";
import { CATEGORY_ORDER, type Category } from "../src/domain/types.ts";
import { LAYER_Z, VIEWBOX, layerInner } from "../src/lib/bikeArt.ts";

const N = 40; // keep in sync with HERO_FRAME_COUNT in src/lib/heroFrames.ts
const byId = new Map(offRoadCatalog.components.map((c) => [c.id, c]));
const sel = new Map<Category, string>();
for (const c of offRoadCatalog.components) if (c.isDefault) sel.set(c.category, c.id);

const CX = VIEWBOX.w / 2;
const CY = VIEWBOX.h / 2 + 30;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => x * x * (3 - 2 * x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function frame(t: number): string {
  const zoom = lerp(1.14, 1.0, smooth(clamp01(t / 0.4)));
  const rot = lerp(-7, 6, t); // slow turn
  const glowX = 30 + t * 40; // % — brand glow drifts
  const sweepX = lerp(-260, 1260, smooth(t)); // red light streak crosses

  // Assembly reveal in build order, over the first ~55% of the scroll.
  const layers = [...CATEGORY_ORDER]
    .sort((a, b) => LAYER_Z[a] - LAYER_Z[b])
    .map((cat) => {
      const k = CATEGORY_ORDER.indexOf(cat);
      const start = (k / CATEGORY_ORDER.length) * 0.55;
      const appear = smooth(clamp01((t - start) / 0.18));
      const dy = (1 - appear) * 26;
      const comp = byId.get(sel.get(cat)!);
      return comp
        ? `<g opacity="${appear.toFixed(3)}" transform="translate(0 ${dy.toFixed(1)})">${layerInner(cat, comp)}</g>`
        : "";
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX.w} ${VIEWBOX.h}" width="${VIEWBOX.w}" height="${VIEWBOX.h}">
  <defs>
    <radialGradient id="glow" cx="${glowX.toFixed(1)}%" cy="40%" r="58%">
      <stop offset="0%" stop-color="#d42a28" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#d42a28" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.10"/>
      <stop offset="55%" stop-color="#d42a28" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#d42a28" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${VIEWBOX.w}" height="${VIEWBOX.h}" fill="#0a0a0b"/>
  <rect width="${VIEWBOX.w}" height="${VIEWBOX.h}" fill="url(#glow)"/>
  <g transform="translate(${CX} ${CY}) rotate(${rot.toFixed(2)}) scale(${zoom.toFixed(3)}) translate(${-CX} ${-CY})">
    ${layers}
  </g>
  <g transform="translate(${sweepX.toFixed(0)} 0) skewX(-12)">
    <rect x="-90" y="-100" width="180" height="${VIEWBOX.h + 200}" fill="url(#sweep)"/>
  </g>
</svg>`;
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "assets", "hero");
mkdirSync(outDir, { recursive: true });
for (let i = 0; i < N; i++) {
  const t = N === 1 ? 0 : i / (N - 1);
  writeFileSync(join(outDir, `frame-${String(i).padStart(4, "0")}.svg`), frame(t), "utf8");
}
console.log(`Wrote ${N} hero frames to ${outDir}.`);
