// AMPERYDE off-road MTB catalog — authoritative seed for the offline/mock data
// layer. Mirrors supabase/migrations/0001_init.sql; supabase/seed.sql is
// generated FROM this file (npm run db:seed-sql) so there is one source of truth.
//
// Structure follows the product spreadsheet (Q1–Q11 + Extras). PRICES ARE
// PLACEHOLDERS in EUR cents — replace priceDeltaCents / basePriceCents with real
// figures. "Only for Hardtail" items carry compatibleFrameTypes: ['hardtail'].
//
// layerAsset points at generated placeholder SVGs; repoint per option to real
// photography / a CDN — the compositing renderer is source-agnostic.

import type { Catalog, Component, Extra } from "@/domain/types";

const LINE_ID = "line-off-road";
const c = (component: Component): Component => component;
const asset = (cat: string, id: string) => `/assets/off-road/${cat}/${id}.svg`;

const components: Component[] = [
  // --- Q1 CHASSIS ----------------------------------------------------------
  c({ id: "chassis-hardtail", lineId: LINE_ID, category: "chassis", name: "Hardtail",
    description: "Rigid rear, light and direct. Unlocks hub motors and triangle batteries.",
    priceDeltaCents: 0, frameType: "hardtail", layerAsset: asset("chassis", "hardtail"), isDefault: true, sortOrder: 10 }),
  c({ id: "chassis-fullsus", lineId: LINE_ID, category: "chassis", name: "Full Suspension",
    description: "Rear travel for technical descents.",
    priceDeltaCents: 120000, frameType: "full_suspension", layerAsset: asset("chassis", "fullsus"), isDefault: false, sortOrder: 20 }),

  // --- Q2 WHEEL SIZE -------------------------------------------------------
  c({ id: "wheel-275", lineId: LINE_ID, category: "wheel_size", name: '27.5"',
    description: "Nimble and playful.", priceDeltaCents: 0, layerAsset: asset("wheel_size", "275"), isDefault: true, sortOrder: 10 }),
  c({ id: "wheel-29", lineId: LINE_ID, category: "wheel_size", name: '29"',
    description: "Rolls fast, holds momentum.", priceDeltaCents: 6000, layerAsset: asset("wheel_size", "29"), isDefault: false, sortOrder: 20 }),
  c({ id: "wheel-mullet", lineId: LINE_ID, category: "wheel_size", name: "Mullet (29\" / 27.5\")",
    description: "Big front wheel, playful rear.", priceDeltaCents: 12000, layerAsset: asset("wheel_size", "mullet"), isDefault: false, sortOrder: 30 }),

  // --- Q3 FRAME SIZE -------------------------------------------------------
  c({ id: "frame-m", lineId: LINE_ID, category: "frame_size", name: "M",
    description: "Rider height ~165–177 cm.", priceDeltaCents: 0, layerAsset: asset("frame_size", "m"), isDefault: true, sortOrder: 10 }),
  c({ id: "frame-l", lineId: LINE_ID, category: "frame_size", name: "L",
    description: "Rider height ~177–186 cm.", priceDeltaCents: 0, layerAsset: asset("frame_size", "l"), isDefault: false, sortOrder: 20 }),
  c({ id: "frame-xl", lineId: LINE_ID, category: "frame_size", name: "XL",
    description: "Rider height ~186–196 cm.", priceDeltaCents: 0, layerAsset: asset("frame_size", "xl"), isDefault: false, sortOrder: 30 }),

  // --- SUSPENSION FORK -----------------------------------------------------
  // PLACEHOLDER prices/travel pending real sourcing. Available on both frames
  // for now (fork travel vs frame pairing is an OPEN decision, like mullet).
  c({ id: "fork-coil-100", lineId: LINE_ID, category: "fork", name: "100mm Coil",
    description: "Coil-sprung fork, 100mm travel. Simple, reliable, low-maintenance.",
    priceDeltaCents: 0, layerAsset: asset("fork", "coil-100"), isDefault: true, sortOrder: 10 }),
  c({ id: "fork-air-130", lineId: LINE_ID, category: "fork", name: "130mm Air",
    description: "Air-sprung fork, 130mm travel, adjustable rebound.",
    priceDeltaCents: 22000, layerAsset: asset("fork", "air-130"), isDefault: false, sortOrder: 20 }),
  c({ id: "fork-air-160", lineId: LINE_ID, category: "fork", name: "160mm Air",
    description: "Air-sprung fork, 160mm travel, high-end damping for big hits.",
    priceDeltaCents: 40000, layerAsset: asset("fork", "air-160"), isDefault: false, sortOrder: 30 }),

  // --- Q4 MOTOR (hub motors are hardtail-only) -----------------------------
  // acceptedVoltages is an ENGINEERING-DEFAULT PLACEHOLDER pending real spec
  // confirmation: 48V is the universal tier; 52V is gated to the higher-power
  // motors (1500W hub, TSDZ16). Wrong voltage into a controller can destroy it,
  // so the engine treats this as a hard safety gate.
  c({ id: "motor-hub-750", lineId: LINE_ID, category: "motor", name: "750W Hub Motor",
    description: "Quiet, low-maintenance rear hub drive.", priceDeltaCents: 0, motorType: "hub",
    acceptedVoltages: [48], compatibleFrameTypes: ["hardtail"], layerAsset: asset("motor", "hub-750"), isDefault: true, sortOrder: 10 }),
  c({ id: "motor-hub-1000", lineId: LINE_ID, category: "motor", name: "1000W Hub Motor",
    description: "More punch, still hub-simple.", priceDeltaCents: 15000, motorType: "hub",
    acceptedVoltages: [48], compatibleFrameTypes: ["hardtail"], layerAsset: asset("motor", "hub-1000"), isDefault: false, sortOrder: 20 }),
  c({ id: "motor-hub-1500", lineId: LINE_ID, category: "motor", name: "1500W Hub Motor",
    description: "Maximum hub power.", priceDeltaCents: 30000, motorType: "hub",
    acceptedVoltages: [48, 52], compatibleFrameTypes: ["hardtail"], layerAsset: asset("motor", "hub-1500"), isDefault: false, sortOrder: 30 }),
  c({ id: "motor-tsdz8", lineId: LINE_ID, category: "motor", name: "TSDZ8 Mid Drive",
    description: "Torque-sensing mid-drive, central mass.", priceDeltaCents: 45000, motorType: "mid_drive",
    acceptedVoltages: [48], layerAsset: asset("motor", "tsdz8"), isDefault: false, sortOrder: 40 }),
  c({ id: "motor-tsdz16", lineId: LINE_ID, category: "motor", name: "TSDZ16 Mid Drive",
    description: "High-output mid-drive for the full send.", priceDeltaCents: 80000, motorType: "mid_drive",
    acceptedVoltages: [48, 52], layerAsset: asset("motor", "tsdz16"), isDefault: false, sortOrder: 50 }),

  // --- Q5 BATTERY (triangle packs are hardtail-only) -----------------------
  c({ id: "battery-downtube-48", lineId: LINE_ID, category: "battery", name: "Downtube 48V",
    description: "Down-tube pack.", priceDeltaCents: 0, voltage: 48, layerAsset: asset("battery", "downtube-48"), isDefault: true, sortOrder: 10 }),
  c({ id: "battery-downtube-52", lineId: LINE_ID, category: "battery", name: "Downtube 52V",
    description: "Higher-voltage down-tube pack.", priceDeltaCents: 12000, voltage: 52, layerAsset: asset("battery", "downtube-52"), isDefault: false, sortOrder: 20 }),
  c({ id: "battery-dual-52", lineId: LINE_ID, category: "battery", name: "Dual Downtube 52V",
    description: "Twin packs for maximum range.", priceDeltaCents: 30000, voltage: 52, layerAsset: asset("battery", "dual-52"), isDefault: false, sortOrder: 30 }),
  c({ id: "battery-triangle-48", lineId: LINE_ID, category: "battery", name: "Triangle 48V",
    description: "In-frame triangle pack.", priceDeltaCents: 8000, voltage: 48, compatibleFrameTypes: ["hardtail"], layerAsset: asset("battery", "triangle-48"), isDefault: false, sortOrder: 40 }),
  c({ id: "battery-triangle-52", lineId: LINE_ID, category: "battery", name: "Triangle 52V",
    description: "Higher-voltage in-frame triangle pack.", priceDeltaCents: 20000, voltage: 52, compatibleFrameTypes: ["hardtail"], layerAsset: asset("battery", "triangle-52"), isDefault: false, sortOrder: 50 }),

  // --- Q6 BRAKES -----------------------------------------------------------
  c({ id: "brakes-mechanical", lineId: LINE_ID, category: "brakes", name: "Mechanical Disc",
    description: "Cable-actuated disc brakes.", priceDeltaCents: 0, layerAsset: asset("brakes", "mechanical"), isDefault: true, sortOrder: 10 }),
  c({ id: "brakes-hydraulic", lineId: LINE_ID, category: "brakes", name: "Hydraulic Disc",
    description: "Sealed hydraulic disc brakes, more power and modulation.", priceDeltaCents: 18000, layerAsset: asset("brakes", "hydraulic"), isDefault: false, sortOrder: 20 }),

  // --- Q7 BRAKE DISCS ------------------------------------------------------
  c({ id: "disc-180", lineId: LINE_ID, category: "brake_disc", name: "180mm",
    description: "Standard rotor size.", priceDeltaCents: 0, layerAsset: asset("brake_disc", "180"), isDefault: true, sortOrder: 10 }),
  c({ id: "disc-200", lineId: LINE_ID, category: "brake_disc", name: "200mm",
    description: "More stopping power and heat capacity.", priceDeltaCents: 4000, layerAsset: asset("brake_disc", "200"), isDefault: false, sortOrder: 20 }),
  c({ id: "disc-220", lineId: LINE_ID, category: "brake_disc", name: "220mm",
    description: "Maximum rotor size for heavy, fast builds.", priceDeltaCents: 8000, layerAsset: asset("brake_disc", "220"), isDefault: false, sortOrder: 30 }),

  // --- Q8 TYRES ------------------------------------------------------------
  c({ id: "tyres-mtb", lineId: LINE_ID, category: "tyres", name: "MTB Knobby",
    description: "Aggressive knobby tread for loose dirt and rock.", priceDeltaCents: 0, layerAsset: asset("tyres", "mtb"), isDefault: true, sortOrder: 10 }),
  c({ id: "tyres-dualsport", lineId: LINE_ID, category: "tyres", name: "Dual Sport",
    description: "Mixed-terrain tread.", priceDeltaCents: 9000, layerAsset: asset("tyres", "dualsport"), isDefault: false, sortOrder: 20 }),
  c({ id: "tyres-supermoto", lineId: LINE_ID, category: "tyres", name: "Supermoto",
    description: "Slick, sticky tread for hardpack.", priceDeltaCents: 15000, layerAsset: asset("tyres", "supermoto"), isDefault: false, sortOrder: 30 }),

  // --- Q9 HANDLEBAR --------------------------------------------------------
  c({ id: "bar-flat", lineId: LINE_ID, category: "handlebar", name: "Flat Bars",
    description: "Low, aggressive riding position.", priceDeltaCents: 0, layerAsset: asset("handlebar", "flat"), isDefault: true, sortOrder: 10 }),
  c({ id: "bar-riser", lineId: LINE_ID, category: "handlebar", name: "Riser Bars",
    description: "Taller, more upright and controlled.", priceDeltaCents: 5000, layerAsset: asset("handlebar", "riser"), isDefault: false, sortOrder: 20 }),

  // --- Q10 SEATPOST (parallelogram is hardtail-only) -----------------------
  c({ id: "seatpost-rigid", lineId: LINE_ID, category: "seatpost", name: "Rigid Seatpost",
    description: "Simple and light.", priceDeltaCents: 0, layerAsset: asset("seatpost", "rigid"), isDefault: true, sortOrder: 10 }),
  c({ id: "seatpost-suspension", lineId: LINE_ID, category: "seatpost", name: "Parallelogram Suspension Seatpost",
    description: "Adds rear comfort on hardtails.", priceDeltaCents: 14000, compatibleFrameTypes: ["hardtail"], layerAsset: asset("seatpost", "suspension"), isDefault: false, sortOrder: 20 }),

  // --- PEDALS vs FOOT PEGS (motor-gated) -----------------------------------
  // Mid-drive motors mechanically require a crankset, so they auto-resolve to
  // pedals (foot pegs are gated to hub motors). Purely ergonomic/mechanical —
  // NO legal claim: every configuration is private-terrain only (see disclaimer).
  c({ id: "pedals-standard", lineId: LINE_ID, category: "pedals", name: "Pedals",
    description: "Standard crankset and pedals. Required for mid-drive motors.",
    priceDeltaCents: 0, layerAsset: asset("pedals", "standard"), isDefault: true, sortOrder: 10 }),
  c({ id: "foot-pegs", lineId: LINE_ID, category: "pedals", name: "Foot Pegs",
    description: "Rear foot pegs instead of pedals. Hub-motor builds only. Private terrain use.",
    priceDeltaCents: 5000, compatibleMotorTypes: ["hub"], layerAsset: asset("pedals", "foot-pegs"), isDefault: false, sortOrder: 20 }),

  // --- Q11 COLOUR + FINISH -------------------------------------------------
  c({ id: "colour-stealth", lineId: LINE_ID, category: "main_colour", name: "Stealth Black",
    priceDeltaCents: 0, swatch: "#1c1d22", layerAsset: asset("main_colour", "stealth"), isDefault: true, sortOrder: 10 }),
  c({ id: "colour-race-red", lineId: LINE_ID, category: "main_colour", name: "Race Red",
    priceDeltaCents: 0, swatch: "#d42a28", layerAsset: asset("main_colour", "race-red"), isDefault: false, sortOrder: 20 }),
  c({ id: "colour-desert-tan", lineId: LINE_ID, category: "main_colour", name: "Desert Tan",
    priceDeltaCents: 0, swatch: "#b9976b", layerAsset: asset("main_colour", "desert-tan"), isDefault: false, sortOrder: 30 }),
  c({ id: "colour-arctic-white", lineId: LINE_ID, category: "main_colour", name: "Arctic White",
    priceDeltaCents: 0, swatch: "#e9eaea", layerAsset: asset("main_colour", "arctic-white"), isDefault: false, sortOrder: 40 }),
  c({ id: "colour-forest-green", lineId: LINE_ID, category: "main_colour", name: "Forest Green",
    priceDeltaCents: 0, swatch: "#2f4a37", layerAsset: asset("main_colour", "forest-green"), isDefault: false, sortOrder: 50 }),

  c({ id: "accent-black", lineId: LINE_ID, category: "accent_colour", name: "Black",
    description: "Grips + brake levers.", priceDeltaCents: 0, swatch: "#161616", layerAsset: asset("accent_colour", "black"), isDefault: true, sortOrder: 10 }),
  c({ id: "accent-red", lineId: LINE_ID, category: "accent_colour", name: "Red",
    description: "Grips + brake levers.", priceDeltaCents: 0, swatch: "#d42a28", layerAsset: asset("accent_colour", "red"), isDefault: false, sortOrder: 20 }),
  c({ id: "accent-silver", lineId: LINE_ID, category: "accent_colour", name: "Silver",
    description: "Grips + brake levers.", priceDeltaCents: 0, swatch: "#9a9c9e", layerAsset: asset("accent_colour", "silver"), isDefault: false, sortOrder: 30 }),
  c({ id: "accent-gold", lineId: LINE_ID, category: "accent_colour", name: "Gold",
    description: "Grips + brake levers.", priceDeltaCents: 5000, swatch: "#c9a24b", layerAsset: asset("accent_colour", "gold"), isDefault: false, sortOrder: 40 }),

  c({ id: "finish-matt", lineId: LINE_ID, category: "finish_type", name: "Matt",
    priceDeltaCents: 0, layerAsset: asset("finish_type", "matt"), isDefault: true, sortOrder: 10 }),
  c({ id: "finish-gloss", lineId: LINE_ID, category: "finish_type", name: "Glossy",
    priceDeltaCents: 6000, layerAsset: asset("finish_type", "gloss"), isDefault: false, sortOrder: 20 }),
];

// --- EXTRAS (optional multi-select accessories) ----------------------------
// NOTE: the Street Legal Kit is intentionally NOT here — it is a SEPARATE
// standalone product (/conversion-kit), never bundled with or cross-sold from
// the off-road line. Foot pegs moved to the motor-gated `pedals` category.
const extras: Extra[] = [
  { id: "extra-fenders", lineId: LINE_ID, name: "Fenders", description: "Front + rear mudguards.", priceDeltaCents: 6000, sortOrder: 10 },
  { id: "extra-lights", lineId: LINE_ID, name: "Lights", description: "Integrated front + rear lighting.", priceDeltaCents: 9000, sortOrder: 20 },
  { id: "extra-lock", lineId: LINE_ID, name: "Lock", description: "Frame-mounted security lock.", priceDeltaCents: 4000, sortOrder: 30 },
  { id: "extra-helmet", lineId: LINE_ID, name: "Helmet", description: "Matched off-road helmet.", priceDeltaCents: 12000, sortOrder: 40 },
  { id: "extra-maintenance-kit", lineId: LINE_ID, name: "Maintenance Kit", description: "Tools + spares for home servicing.", priceDeltaCents: 7000, sortOrder: 50 },
  { id: "extra-fairings", lineId: LINE_ID, name: "Custom Sport Fairings", description: "Bodywork fairings for a moto look.", priceDeltaCents: 35000, sortOrder: 60 },
];

export const offRoadCatalog: Catalog = {
  line: {
    id: LINE_ID,
    slug: "off-road",
    name: "AMPERYDE Off-Road",
    description: "Custom off-road electric mountain bikes, built to order.",
    basePriceCents: 200000, // PLACEHOLDER €2,000 base build
    currency: "EUR",
  },
  components,
  extras,
  incompatibilities: [],
  presets: [
    {
      id: "preset-trailhead", lineId: LINE_ID, tier: 1, name: "Trailhead",
      tagline: "The honest entry point. Hardtail, hub-driven, ready for dirt.",
      heroAsset: "/assets/off-road/presets/trailhead.png", sortOrder: 10,
      componentIds: ["chassis-hardtail", "wheel-275", "frame-m", "fork-coil-100", "motor-hub-750", "battery-downtube-48", "brakes-mechanical", "disc-180", "tyres-mtb", "bar-flat", "seatpost-rigid", "pedals-standard", "colour-stealth", "accent-black", "finish-matt"],
    },
    {
      id: "preset-ridgeline", lineId: LINE_ID, tier: 2, name: "Ridgeline",
      tagline: "Full-suspension mid-drive for all-day technical terrain.",
      heroAsset: "/assets/off-road/presets/ridgeline.png", sortOrder: 20,
      componentIds: ["chassis-fullsus", "wheel-29", "frame-l", "fork-air-130", "motor-tsdz8", "battery-downtube-48", "brakes-hydraulic", "disc-200", "tyres-dualsport", "bar-riser", "seatpost-rigid", "pedals-standard", "colour-desert-tan", "accent-silver", "finish-matt"],
      extraIds: ["extra-lights", "extra-fenders"],
    },
    {
      id: "preset-apex", lineId: LINE_ID, tier: 3, name: "Apex",
      tagline: "The full send. Mullet, TSDZ16, dual battery, no compromises.",
      heroAsset: "/assets/off-road/presets/apex.png", sortOrder: 30,
      componentIds: ["chassis-fullsus", "wheel-mullet", "frame-l", "fork-air-160", "motor-tsdz16", "battery-dual-52", "brakes-hydraulic", "disc-220", "tyres-supermoto", "bar-riser", "seatpost-rigid", "pedals-standard", "colour-race-red", "accent-gold", "finish-gloss"],
      extraIds: ["extra-fairings", "extra-lights"],
    },
  ],
};
