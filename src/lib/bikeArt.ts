// Placeholder bike art — one source for the per-category layer SVGs.
//
// Each painter draws ONE category's layer in a SHARED coordinate space so the
// layers composite into a coherent side-profile bike when stacked. Real
// photography / renders replace these per option; the compositing renderer
// neither knows nor cares which is in place. Pure string-building (no React /
// DOM) so it runs in Node (generators) and the browser (fallback) alike.
//
// This is placeholder art: not every category renders a distinct shape (frame
// size, accent colour, and finish type intentionally draw nothing).

import type { Category, Component } from "@/domain/types";

export const VIEWBOX = { w: 1000, h: 640 };

export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

const FULL: Region = { x: 150, y: 150, w: 700, h: 380 };
const FRONT_WHEEL: Region = { x: 560, y: 300, w: 380, h: 320 };
const COCKPIT: Region = { x: 590, y: 120, w: 320, h: 260 };

// Zoom targets (in viewBox units) for each configurator step.
export const FOCUS_REGIONS: Record<Category, Region> = {
  chassis: FULL,
  wheel_size: FRONT_WHEEL,
  frame_size: FULL,
  fork: { x: 620, y: 205, w: 250, h: 290 },
  motor: { x: 200, y: 330, w: 380, h: 270 },
  battery: { x: 360, y: 240, w: 300, h: 260 },
  brakes: { x: 590, y: 320, w: 300, h: 300 },
  brake_disc: { x: 590, y: 320, w: 300, h: 300 },
  tyres: FRONT_WHEEL,
  handlebar: COCKPIT,
  seatpost: { x: 300, y: 150, w: 260, h: 260 },
  pedals: { x: 330, y: 380, w: 260, h: 220 },
  main_colour: FULL,
  accent_colour: COCKPIT,
  finish_type: FULL,
};

// Layer paint order (low draws first / behind).
export const LAYER_Z: Record<Category, number> = {
  wheel_size: 10,
  tyres: 12,
  chassis: 20,
  fork: 22,
  seatpost: 22,
  brake_disc: 24,
  battery: 30,
  motor: 40,
  brakes: 44,
  pedals: 42,
  main_colour: 46,
  accent_colour: 47,
  finish_type: 48,
  frame_size: 5,
  handlebar: 60,
};

// --- Geometry -------------------------------------------------------------
const REAR = { cx: 275, cy: 452, r: 150 };
const FRONT = { cx: 735, cy: 452, r: 150 };
const BB = { x: 432, y: 454 };
const SEAT = { x: 378, y: 252 };
const HEAD_TOP = { x: 690, y: 224 };
const HEAD_BOT = { x: 650, y: 300 };

const C = {
  steel: "#b3b9c4",
  tire: "#141519",
  rim: "#cbd0d8",
  spoke: "#7d828d",
  hub: "#3c3f49",
  metal: "#9aa0ab",
  batt: "#22242c",
  battTop: "#2d303a",
  brand: "#e23a34",
};

const line = (x1: number, y1: number, x2: number, y2: number, stroke: string, w: number, cap = "round") =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="${cap}"/>`;
const circle = (cx: number, cy: number, r: number, attrs: string) => `<circle cx="${cx}" cy="${cy}" r="${r}" ${attrs}/>`;
const angle = (ax: number, ay: number, bx: number, by: number) => (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;

// =========================================================================
// Layer painters
// =========================================================================

function chassisLayer(comp: Component): string {
  const col = C.steel;
  const full = comp.frameType === "full_suspension";
  const w = 17;
  const parts: string[] = [
    line(BB.x, BB.y, HEAD_BOT.x, HEAD_BOT.y, col, w), // down tube
    line(SEAT.x, SEAT.y, HEAD_TOP.x, HEAD_TOP.y, col, w), // top tube
    line(BB.x, BB.y, SEAT.x, SEAT.y, col, w), // seat tube
    line(HEAD_BOT.x, HEAD_BOT.y, HEAD_TOP.x, HEAD_TOP.y, col, w + 4), // head tube
    line(HEAD_TOP.x, HEAD_TOP.y, FRONT.cx, FRONT.cy, col, 13), // fork
    circle(BB.x, BB.y, 15, `fill="${C.hub}" stroke="${C.metal}" stroke-width="3"`), // BB
  ];
  if (full) {
    parts.push(line(BB.x + 4, BB.y - 6, REAR.cx, REAR.cy, col, w));
    parts.push(line(REAR.cx, REAR.cy, 452, 372, col, 12));
    parts.push(line(452, 372, 470, 300, "#5a5e68", 14)); // shock
    parts.push(circle(BB.x + 6, BB.y - 8, 12, `fill="${C.hub}" stroke="${C.metal}" stroke-width="3"`));
  } else {
    parts.push(line(BB.x, BB.y, REAR.cx, REAR.cy, col, w));
    parts.push(line(REAR.cx, REAR.cy, SEAT.x, SEAT.y, col, w));
  }
  return parts.join("");
}

function wheelSizeLayer(comp: Component): string {
  const mullet = comp.id.includes("mullet");
  const big = comp.id.includes("29");
  const rRear = mullet ? 138 : big ? 152 : 142;
  const rFront = mullet ? 152 : big ? 152 : 142;
  const tireW = 26;
  const wheel = (cx: number, cy: number, r: number): string => {
    const spokes: string[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      spokes.push(line(cx, cy, cx + Math.cos(a) * (r - tireW - 6), cy + Math.sin(a) * (r - tireW - 6), C.spoke, 2));
    }
    return [
      circle(cx, cy, r, `fill="none" stroke="${C.tire}" stroke-width="${tireW}"`),
      circle(cx, cy, r - tireW - 3, `fill="none" stroke="${C.rim}" stroke-width="5"`),
      ...spokes,
      circle(cx, cy, 12, `fill="${C.hub}"`),
    ].join("");
  };
  return wheel(REAR.cx, REAR.cy, rRear) + wheel(FRONT.cx, FRONT.cy, rFront);
}

function tyresLayer(comp: Component): string {
  const dash: Record<string, string> = { "tyres-mtb": "20 14", "tyres-dualsport": "10 12", "tyres-supermoto": "3 22" };
  const d = dash[comp.id] ?? "12 12";
  const r = 150;
  const tread = (cx: number, cy: number) =>
    circle(cx, cy, r, `fill="none" stroke="#0b0c0f" stroke-width="26" stroke-dasharray="${d}"`);
  return tread(REAR.cx, REAR.cy) + tread(FRONT.cx, FRONT.cy);
}

function motorLayer(comp: Component): string {
  if (comp.motorType === "hub") {
    const r = comp.id.includes("1500") ? 64 : comp.id.includes("1000") ? 58 : 52;
    const fins: string[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      fins.push(line(REAR.cx + Math.cos(a) * (r - 12), REAR.cy + Math.sin(a) * (r - 12), REAR.cx + Math.cos(a) * r, REAR.cy + Math.sin(a) * r, "#54586180", 4));
    }
    return [
      circle(REAR.cx, REAR.cy, r, `fill="${C.hub}" stroke="${C.metal}" stroke-width="3"`),
      ...fins,
      circle(REAR.cx, REAR.cy, r - 18, `fill="none" stroke="${C.brand}" stroke-width="3" opacity="0.8"`),
      circle(REAR.cx, REAR.cy, 10, `fill="${C.metal}"`),
    ].join("");
  }
  const big = comp.id.includes("tsdz16");
  const w = big ? 150 : 122;
  const h = big ? 118 : 98;
  const x = BB.x - w / 2 + 6;
  const y = BB.y - h / 2 + 6;
  const fins: string[] = [];
  for (let i = 1; i < 6; i++) fins.push(line(x + 14, y + i * (h / 6), x + w - 14, y + i * (h / 6), "#4c505a", 4));
  return [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${C.hub}" stroke="${C.metal}" stroke-width="3"/>`,
    ...fins,
    `<rect x="${x + 16}" y="${y + h - 22}" width="${w - 32}" height="6" rx="3" fill="${C.brand}" opacity="0.85"/>`,
    circle(BB.x, BB.y, 22, `fill="none" stroke="${C.metal}" stroke-width="5"`),
  ].join("");
}

function batteryLayer(comp: Component): string {
  const v = comp.voltage ?? 48;
  const len = v >= 52 ? 200 : 176;
  const wdt = 54;
  const pack = (mx: number, my: number, rot: number) =>
    `<g transform="translate(${mx} ${my}) rotate(${rot})">
      <rect x="${-len / 2}" y="${-wdt / 2}" width="${len}" height="${wdt}" rx="14" fill="${C.batt}" stroke="${C.battTop}" stroke-width="3"/>
      <rect x="${-len / 2 + 8}" y="${-wdt / 2 + 8}" width="${len - 16}" height="12" rx="6" fill="${C.battTop}"/>
      <rect x="${-len / 2 + 14}" y="${wdt / 2 - 12}" width="${len - 28}" height="5" rx="2.5" fill="${C.brand}" opacity="0.85"/>
    </g>`;
  const dtMx = (BB.x + HEAD_BOT.x) / 2;
  const dtMy = (BB.y + HEAD_BOT.y) / 2;
  const dtRot = angle(BB.x, BB.y, HEAD_BOT.x, HEAD_BOT.y);

  if (comp.id.includes("triangle")) {
    // In-frame triangle pack.
    return `<path d="M${BB.x + 8} ${BB.y - 12} L${SEAT.x + 8} ${SEAT.y + 16} L${HEAD_BOT.x - 20} ${HEAD_BOT.y - 6} Z" fill="${C.batt}" stroke="${C.battTop}" stroke-width="3"/>`;
  }
  if (comp.id.includes("dual")) {
    // Down tube + a second pack under the top tube.
    const ttMx = (SEAT.x + HEAD_TOP.x) / 2;
    const ttMy = (SEAT.y + HEAD_TOP.y) / 2 + 18;
    return pack(dtMx, dtMy, dtRot) + pack(ttMx, ttMy, angle(SEAT.x, SEAT.y, HEAD_TOP.x, HEAD_TOP.y));
  }
  return pack(dtMx, dtMy, dtRot);
}

function brakeDiscLayer(comp: Component): string {
  const r = comp.id.includes("220") ? 84 : comp.id.includes("200") ? 74 : 62;
  const rotor = (cx: number, cy: number) => {
    const holes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      holes.push(circle(cx + Math.cos(a) * (r - 12), cy + Math.sin(a) * (r - 12), 3, `fill="#0b0c0f"`));
    }
    return [circle(cx, cy, r, `fill="none" stroke="${C.metal}" stroke-width="4"`), circle(cx, cy, r - 6, `fill="none" stroke="#6b6f79" stroke-width="1.5"`), ...holes].join("");
  };
  return rotor(FRONT.cx, FRONT.cy) + rotor(REAR.cx, REAR.cy);
}

function brakesLayer(comp: Component): string {
  const hydraulic = comp.id.includes("hydraulic");
  const stroke = hydraulic ? C.brand : C.metal;
  const cal = (cx: number, cy: number) =>
    `<rect x="${cx - 12}" y="${cy - 82}" width="${hydraulic ? 28 : 22}" height="${hydraulic ? 34 : 28}" rx="5" fill="${C.hub}" stroke="${stroke}" stroke-width="2"/>`;
  return cal(FRONT.cx, FRONT.cy) + cal(REAR.cx, REAR.cy);
}

function handlebarLayer(comp: Component): string {
  const riser = comp.id.includes("riser");
  const barTop = HEAD_TOP.y - (riser ? 78 : 54);
  return [
    line(HEAD_TOP.x, HEAD_TOP.y, HEAD_TOP.x + 6, barTop, C.metal, 10),
    line(HEAD_TOP.x - 40, barTop, HEAD_TOP.x + 58, barTop - 10, C.hub, 13),
    line(HEAD_TOP.x - 40, barTop, HEAD_TOP.x - 62, barTop + 6, C.tire, 16), // grip
    `<rect x="${HEAD_TOP.x - 4}" y="${barTop - 32}" width="48" height="26" rx="6" fill="#0d0e12" stroke="${C.metal}" stroke-width="2"/>`,
  ].join("");
}

function seatpostLayer(comp: Component): string {
  const susp = comp.id.includes("suspension");
  const parts: string[] = [];
  if (susp) {
    parts.push(line(SEAT.x, SEAT.y, SEAT.x - 2, SEAT.y - 26, C.metal, 9));
    parts.push(line(SEAT.x - 2, SEAT.y - 26, SEAT.x - 26, SEAT.y - 40, C.hub, 9)); // parallelogram link
    parts.push(line(SEAT.x - 26, SEAT.y - 40, SEAT.x - 24, SEAT.y - 58, C.metal, 8));
    parts.push(`<rect x="${SEAT.x - 64}" y="${SEAT.y - 72}" width="86" height="16" rx="8" fill="${C.hub}"/>`);
  } else {
    parts.push(line(SEAT.x, SEAT.y, SEAT.x - 6, SEAT.y - 44, C.metal, 9));
    parts.push(`<rect x="${SEAT.x - 44}" y="${SEAT.y - 60}" width="86" height="16" rx="8" fill="${C.hub}"/>`);
  }
  return parts.join("");
}

function mainColourLayer(comp: Component): string {
  const paint = comp.swatch ?? "#1c1d22";
  // Tint the main tubes and a tank panel in the chosen colour.
  return [
    line(BB.x, BB.y, HEAD_BOT.x, HEAD_BOT.y, paint, 10),
    line(SEAT.x, SEAT.y, HEAD_TOP.x, HEAD_TOP.y, paint, 10),
    `<path d="M${SEAT.x + 20} ${SEAT.y - 4} L${HEAD_TOP.x - 30} ${HEAD_TOP.y - 2} L${HEAD_TOP.x - 30} ${HEAD_TOP.y + 18} L${SEAT.x + 20} ${SEAT.y + 20} Z" fill="${paint}" opacity="0.9"/>`,
  ].join("");
}

function pedalsLayer(comp: Component): string {
  if (comp.id.includes("foot-pegs")) {
    // A rear foot peg near the rear axle.
    return `<rect x="${REAR.cx + 44}" y="${REAR.cy - 5}" width="36" height="10" rx="4" fill="${C.hub}" stroke="${C.metal}" stroke-width="2"/>`;
  }
  // Crank arm + pedal at the bottom bracket.
  return [
    line(BB.x, BB.y, BB.x - 8, BB.y + 54, C.metal, 8),
    `<rect x="${BB.x - 28}" y="${BB.y + 52}" width="36" height="11" rx="3" fill="${C.hub}"/>`,
  ].join("");
}

function forkLayer(comp: Component): string {
  const air = comp.id.includes("air");
  const long = comp.id.includes("160");
  const mid = comp.id.includes("130");
  const crownX = 700, crownY = 250;
  const axleX = FRONT.cx, axleY = FRONT.cy;
  // More travel => longer lowers (the stanchion/lower junction sits higher).
  const frac = long ? 0.34 : mid ? 0.44 : 0.52;
  const jx = crownX + (axleX - crownX) * frac;
  const jy = crownY + (axleY - crownY) * frac;
  const parts: string[] = [
    line(crownX, crownY, jx, jy, air ? "#c9ced6" : C.metal, 9), // stanchion
    line(jx, jy, axleX, axleY, "#1b1c22", 14), // lower leg
    `<rect x="${crownX - 10}" y="${crownY - 8}" width="22" height="16" rx="4" fill="${C.hub}" stroke="${C.metal}" stroke-width="2"/>`,
  ];
  if (air) {
    parts.push(circle(crownX + 1, crownY - 10, 5, `fill="${C.brand}"`)); // air cap accent
  } else {
    for (let i = 1; i <= 4; i++) {
      const t = i / 5;
      const sx = crownX + (jx - crownX) * t;
      const sy = crownY + (jy - crownY) * t;
      parts.push(line(sx - 5, sy - 2, sx + 5, sy + 2, "#8b8f98", 2)); // coil ticks
    }
  }
  return parts.join("");
}

const NONE = () => "";

const PAINTERS: Record<Category, (c: Component) => string> = {
  chassis: chassisLayer,
  wheel_size: wheelSizeLayer,
  frame_size: NONE,
  fork: forkLayer,
  motor: motorLayer,
  battery: batteryLayer,
  brakes: brakesLayer,
  brake_disc: brakeDiscLayer,
  tyres: tyresLayer,
  handlebar: handlebarLayer,
  seatpost: seatpostLayer,
  pedals: pedalsLayer,
  main_colour: mainColourLayer,
  accent_colour: NONE,
  finish_type: NONE,
};

/** Inner SVG markup for a single component's layer (no <svg> wrapper). */
export function layerInner(category: Category, comp: Component): string {
  return PAINTERS[category]?.(comp) ?? "";
}

/** A standalone, transparent SVG document for one component's layer. */
export function layerSvgDocument(category: Category, comp: Component): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX.w} ${VIEWBOX.h}" width="${VIEWBOX.w}" height="${VIEWBOX.h}" fill="none">${layerInner(category, comp)}</svg>`;
}

/** Data-URI form, for the client-side missing-asset fallback. */
export function layerDataUri(category: Category, comp: Component): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(layerSvgDocument(category, comp))}`;
}
