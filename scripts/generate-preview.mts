// Dev-only: composes full builds into single SVGs (dark background, layers
// stacked in paint order) so the placeholder composite can be eyeballed without
// running the app. Not part of the product.

import { writeFileSync } from "node:fs";
import { offRoadCatalog } from "../src/data/seed/offRoad.ts";
import { CATEGORY_ORDER, type Category } from "../src/domain/types.ts";
import { LAYER_Z, VIEWBOX, layerInner } from "../src/lib/bikeArt.ts";

const outDir = process.argv[2] ?? ".";
const byId = new Map(offRoadCatalog.components.map((c) => [c.id, c]));

function compose(title: string, componentIds: string[]): string {
  const sel = new Map<Category, string>();
  for (const id of componentIds) {
    const c = byId.get(id);
    if (c) sel.set(c.category, id);
  }
  const layers = [...CATEGORY_ORDER]
    .filter((cat) => sel.has(cat))
    .sort((a, b) => LAYER_Z[a] - LAYER_Z[b])
    .map((cat) => `<g>${layerInner(cat, byId.get(sel.get(cat)!)!)}</g>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX.w} ${VIEWBOX.h}" width="${VIEWBOX.w}" height="${VIEWBOX.h}">
    <rect width="${VIEWBOX.w}" height="${VIEWBOX.h}" fill="#0a0a0c"/>
    <text x="28" y="44" fill="#6c6c78" font-family="monospace" font-size="18" letter-spacing="3">${title.toUpperCase()}</text>
    ${layers}
  </svg>`;
}

const defaults = offRoadCatalog.components.filter((c) => c.isDefault).map((c) => c.id);

const builds: [string, string, string[]][] = [
  ["base build (defaults)", "preview-base.svg", defaults],
  ...offRoadCatalog.presets.map(
    (p) => [`${p.name} preset`, `preview-${p.id}.svg`, p.componentIds] as [string, string, string[]],
  ),
];

for (const [title, file, ids] of builds) {
  writeFileSync(`${outDir}/${file}`, compose(title, ids), "utf8");
  console.log(`Wrote ${outDir}/${file}`);
}
