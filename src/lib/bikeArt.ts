// Placeholder bike art — a single source for the per-category layer PNGs/SVGs.
//
// Each function draws ONE category's layer in a SHARED coordinate space so the
// layers composite into a coherent side-profile bike when stacked. Real
// photography or rendered turntable frames will replace these files (or the
// component's asset reference will repoint to a CDN) category-by-category; the
// compositing renderer neither knows nor cares which is in place.
//
// Pure string-building (no React, no DOM) so it runs in Node (the file
// generator) and in the browser (the missing-asset fallback) alike.

import type { Category, Component } from "@/domain/types";

export const VIEWBOX = { w: 1000, h: 640 };

export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Zoom targets (in viewBox units) for each configurator step.
export const FOCUS_REGIONS: Record<Category, Region> = {
  chassis: { x: 150, y: 150, w: 700, h: 380 },
  wheels: { x: 560, y: 300, w: 380, h: 320 },
  motor: { x: 200, y: 330, w: 360, h: 260 },
  battery: { x: 380, y: 250, w: 260, h: 250 },
  brakes: { x: 590, y: 320, w: 300, h: 300 },
  cockpit: { x: 590, y: 120, w: 320, h: 260 },
  finish: { x: 150, y: 150, w: 700, h: 380 },
};

// Layer paint order (low draws first / behind).
export const LAYER_Z: Record<Category, number> = {
  wheels: 10,
  chassis: 20,
  brakes: 25,
  battery: 30,
  motor: 40,
  finish: 50,
  cockpit: 60,
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
  carbon: "#33353f",
  tire: "#141519",
  rim: "#cbd0d8",
  spoke: "#7d828d",
  hub: "#3c3f49",
  metal: "#9aa0ab",
  batt: "#22242c",
  battTop: "#2d303a",
  volt: "#d6f24e",
  line: "#dcdcd8",
};

// --- Primitives -----------------------------------------------------------
const line = (x1: number, y1: number, x2: number, y2: number, stroke: string, w: number, cap = "round") =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="${cap}"/>`;

const circle = (cx: number, cy: number, r: number, attrs: string) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" ${attrs}/>`;

const angle = (ax: number, ay: number, bx: number, by: number) => (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;

// =========================================================================
// Layer painters
// =========================================================================

function chassisLayer(comp: Component): string {
  const carbon = comp.id.includes("carbon");
  const col = carbon ? C.carbon : C.steel;
  const full = comp.frameType === "full_suspension";
  const w = 17;

  const parts: string[] = [];
  // Front triangle (shared).
  parts.push(line(BB.x, BB.y, HEAD_BOT.x, HEAD_BOT.y, col, w)); // down tube
  parts.push(line(SEAT.x, SEAT.y, HEAD_TOP.x, HEAD_TOP.y, col, w)); // top tube
  parts.push(line(BB.x, BB.y, SEAT.x, SEAT.y, col, w)); // seat tube
  parts.push(line(HEAD_BOT.x, HEAD_BOT.y, HEAD_TOP.x, HEAD_TOP.y, col, w + 4)); // head tube

  if (full) {
    // Swingarm + shock + pivot.
    parts.push(line(BB.x + 4, BB.y - 6, REAR.cx, REAR.cy, col, w)); // upper swingarm
    parts.push(line(REAR.cx, REAR.cy, 452, 372, col, 12)); // seatstay link
    parts.push(line(452, 372, 470, 300, "#5a5e68", 14)); // shock body
    parts.push(circle(BB.x + 6, BB.y - 8, 12, `fill="${C.hub}" stroke="${C.metal}" stroke-width="3"`)); // main pivot
  } else {
    // Rigid rear triangle.
    parts.push(line(BB.x, BB.y, REAR.cx, REAR.cy, col, w)); // chain stay
    parts.push(line(REAR.cx, REAR.cy, SEAT.x, SEAT.y, col, w)); // seat stay
  }

  // Fork + steerer + seatpost + saddle + crank.
  parts.push(line(HEAD_TOP.x, HEAD_TOP.y, FRONT.cx, FRONT.cy, col, 13)); // fork
  parts.push(line(SEAT.x, SEAT.y, SEAT.x - 6, SEAT.y - 44, C.metal, 9)); // seatpost
  parts.push(`<rect x="${SEAT.x - 44}" y="${SEAT.y - 60}" width="86" height="16" rx="8" fill="${C.hub}"/>`); // saddle
  parts.push(circle(BB.x, BB.y, 15, `fill="${C.hub}" stroke="${C.metal}" stroke-width="3"`)); // BB
  return parts.join("");
}

function wheelsLayer(comp: Component): string {
  const supermoto = comp.id.includes("supermoto");
  const mullet = comp.id.includes("mullet");
  const rRear = mullet ? 138 : supermoto ? 132 : 150;
  const rFront = mullet ? 156 : supermoto ? 132 : 150;
  const tireW = supermoto ? 18 : 30;

  const tread: Record<string, string> = {
    knobby: "20 14",
    dualsport: "10 12",
    supermoto: "0",
    mullet: "18 12",
  };
  const key = comp.id.replace("wheels-", "");
  const dash = tread[key] ?? "12 12";

  const wheel = (cx: number, cy: number, r: number): string => {
    const spokes: string[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      spokes.push(line(cx, cy, cx + Math.cos(a) * (r - tireW - 6), cy + Math.sin(a) * (r - tireW - 6), C.spoke, 2));
    }
    return [
      circle(cx, cy, r, `fill="none" stroke="${C.tire}" stroke-width="${tireW}"`), // tire
      dash !== "0"
        ? circle(cx, cy, r, `fill="none" stroke="#0c0d10" stroke-width="${tireW}" stroke-dasharray="${dash}"`)
        : "", // tread
      circle(cx, cy, r - tireW - 3, `fill="none" stroke="${C.rim}" stroke-width="5"`), // rim
      ...spokes,
      circle(cx, cy, 12, `fill="${C.hub}"`), // hub
    ].join("");
  };

  return wheel(REAR.cx, REAR.cy, rRear) + wheel(FRONT.cx, FRONT.cy, rFront);
}

function motorLayer(comp: Component): string {
  if (comp.motorType === "hub") {
    const r = comp.id.includes("1500") ? 64 : 56;
    const fins: string[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      fins.push(line(REAR.cx + Math.cos(a) * (r - 12), REAR.cy + Math.sin(a) * (r - 12), REAR.cx + Math.cos(a) * r, REAR.cy + Math.sin(a) * r, "#54586180", 4));
    }
    return [
      circle(REAR.cx, REAR.cy, r, `fill="${C.hub}" stroke="${C.metal}" stroke-width="3"`),
      ...fins,
      circle(REAR.cx, REAR.cy, r - 18, `fill="none" stroke="${C.volt}" stroke-width="3" opacity="0.8"`),
      circle(REAR.cx, REAR.cy, 10, `fill="${C.metal}"`),
    ].join("");
  }
  // Mid-drive block near the bottom bracket.
  const big = comp.id.includes("5000");
  const w = big ? 150 : 122;
  const h = big ? 118 : 98;
  const x = BB.x - w / 2 + 6;
  const y = BB.y - h / 2 + 6;
  const fins: string[] = [];
  for (let i = 1; i < 6; i++) fins.push(line(x + 14, y + i * (h / 6), x + w - 14, y + i * (h / 6), "#4c505a", 4));
  return [
    `<path d="M${x} ${y + 18} Q${x} ${y} ${x + 18} ${y} L${x + w - 18} ${y} Q${x + w} ${y} ${x + w} ${y + 18} L${x + w} ${y + h - 18} Q${x + w} ${y + h} ${x + w - 18} ${y + h} L${x + 18} ${y + h} Q${x} ${y + h} ${x} ${y + h - 18} Z" fill="${C.hub}" stroke="${C.metal}" stroke-width="3"/>`,
    ...fins,
    `<rect x="${x + 16}" y="${y + h - 22}" width="${w - 32}" height="6" rx="3" fill="${C.volt}" opacity="0.85"/>`,
    circle(BB.x, BB.y, 22, `fill="none" stroke="${C.metal}" stroke-width="5"`), // chainring hint
  ].join("");
}

function batteryLayer(comp: Component): string {
  const v = comp.voltage ?? 48;
  const lenMap: Record<number, number> = { 48: 168, 52: 190, 60: 216, 72: 246 };
  const len = lenMap[v] ?? 180;
  const wdt = 58;
  // Seat along the down tube.
  const mx = (BB.x + HEAD_BOT.x) / 2;
  const my = (BB.y + HEAD_BOT.y) / 2;
  const rot = angle(BB.x, BB.y, HEAD_BOT.x, HEAD_BOT.y);
  const cells = Math.round(v / 12);
  const leds: string[] = [];
  for (let i = 0; i < cells; i++) {
    leds.push(`<rect x="${-len / 2 + 16 + i * ((len - 32) / cells)}" y="${wdt / 2 - 12}" width="${(len - 40) / cells}" height="5" rx="2.5" fill="${C.volt}" opacity="0.85"/>`);
  }
  return `<g transform="translate(${mx} ${my}) rotate(${rot})">
    <rect x="${-len / 2}" y="${-wdt / 2}" width="${len}" height="${wdt}" rx="14" fill="${C.batt}" stroke="${C.battTop}" stroke-width="3"/>
    <rect x="${-len / 2 + 8}" y="${-wdt / 2 + 8}" width="${len - 16}" height="14" rx="7" fill="${C.battTop}"/>
    ${leds.join("")}
  </g>`;
}

function brakesLayer(comp: Component): string {
  const r = comp.id.includes("203") ? 82 : comp.id.includes("4piston") ? 70 : 58;
  const rotor = (cx: number, cy: number): string => {
    const holes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      holes.push(circle(cx + Math.cos(a) * (r - 12), cy + Math.sin(a) * (r - 12), 3, `fill="#0b0c0f"`));
    }
    return [
      circle(cx, cy, r, `fill="none" stroke="${C.metal}" stroke-width="4"`),
      circle(cx, cy, r - 6, `fill="none" stroke="#6b6f79" stroke-width="1.5"`),
      ...holes,
      // caliper at top of rotor
      `<rect x="${cx - 12}" y="${cy - r - 12}" width="24" height="30" rx="5" fill="${C.hub}" stroke="${C.volt}" stroke-width="2"/>`,
    ].join("");
  };
  return rotor(FRONT.cx, FRONT.cy) + rotor(REAR.cx, REAR.cy);
}

function cockpitLayer(comp: Component): string {
  const riser = comp.id.includes("riser");
  const pro = comp.id.includes("display-pro");
  const barTop = HEAD_TOP.y - (riser ? 78 : 54);
  const parts: string[] = [
    line(HEAD_TOP.x, HEAD_TOP.y, HEAD_TOP.x + 6, barTop, C.metal, 10), // stem/steerer riser
    line(HEAD_TOP.x - 40, barTop, HEAD_TOP.x + 58, barTop - 10, C.hub, 13), // handlebar
    line(HEAD_TOP.x - 40, barTop, HEAD_TOP.x - 62, barTop + 6, C.tire, 16), // grip
  ];
  // Display.
  const dw = pro ? 62 : 40;
  const dh = pro ? 40 : 26;
  parts.push(`<rect x="${HEAD_TOP.x - 4}" y="${barTop - dh - 6}" width="${dw}" height="${dh}" rx="6" fill="#0d0e12" stroke="${C.metal}" stroke-width="2"/>`);
  parts.push(`<rect x="${HEAD_TOP.x}" y="${barTop - dh - 2}" width="${dw - 8}" height="${dh - 8}" rx="3" fill="${pro ? C.volt : "#33363f"}" opacity="${pro ? 0.85 : 1}"/>`);
  return parts.join("");
}

function finishLayer(comp: Component): string {
  const colors: Record<string, string> = {
    "finish-stealth": "#1c1d22",
    "finish-desert": "#b9976b",
    "finish-forged-carbon": "#3b3e47",
  };
  const paint = colors[comp.id] ?? "#1c1d22";
  const weave = comp.id.includes("carbon")
    ? `<pattern id="weave" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="${paint}"/><line x1="0" y1="0" x2="0" y2="10" stroke="#4a4d57" stroke-width="3"/></pattern>`
    : "";
  const fill = weave ? "url(#weave)" : paint;
  return `${weave ? `<defs>${weave}</defs>` : ""}
    <!-- top-tube tank panel -->
    <path d="M${SEAT.x + 20} ${SEAT.y - 6} L${HEAD_TOP.x - 30} ${HEAD_TOP.y - 4} L${HEAD_TOP.x - 30} ${HEAD_TOP.y + 20} L${SEAT.x + 20} ${SEAT.y + 22} Z" fill="${fill}" opacity="0.92"/>
    <!-- front number plate -->
    <path d="M${HEAD_TOP.x + 10} ${HEAD_TOP.y + 6} q40 6 44 74 l-30 6 q-14 -44 -32 -60 Z" fill="${fill}" opacity="0.92"/>
    <rect x="${SEAT.x + 30}" y="${SEAT.y + 2}" width="70" height="4" rx="2" fill="${C.volt}" opacity="0.7"/>`;
}

const PAINTERS: Record<Category, (c: Component) => string> = {
  chassis: chassisLayer,
  wheels: wheelsLayer,
  motor: motorLayer,
  battery: batteryLayer,
  brakes: brakesLayer,
  cockpit: cockpitLayer,
  finish: finishLayer,
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
