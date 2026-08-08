// Writes placeholder layer art to public/ at each component's layerAsset path,
// from the shared art module (src/lib/bikeArt.ts). Rerun after changing the art.
//
// Run: npm run art:placeholders
//
// These are throwaway stand-ins. To go live with real imagery, drop PNG/render
// files at the same paths (or repoint the component's layerAsset to a CDN URL)
// category-by-category — no code change needed.

import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { offRoadCatalog } from "../src/data/seed/offRoad.ts";
import { layerSvgDocument } from "../src/lib/bikeArt.ts";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

let count = 0;
for (const comp of offRoadCatalog.components) {
  const ref = comp.layerAsset; // e.g. /assets/off-road/wheels/knobby.svg
  const outPath = join(publicDir, ref);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, layerSvgDocument(comp.category, comp), "utf8");
  count++;
}

console.log(`Wrote ${count} placeholder layer files under ${join(publicDir, "assets")}.`);
