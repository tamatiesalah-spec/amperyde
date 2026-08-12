// AMPERYDE domain types — pure, framework-free. Mirrors supabase/migrations.
//
// The catalog models the OFF-ROAD MTB build. The Street Legal Kit is an
// EXTRA add-on (pedal conversion + power/speed-limiting docs) that can be added
// to any bike; when fitted it makes the build road-legal. Without it, a build is
// private-terrain only (see the disclaimer surfaced in the configurator).

export type Category =
  | "chassis"
  | "wheel_size"
  | "frame_size"
  | "fork"
  | "motor"
  | "battery"
  | "brakes"
  | "brake_disc"
  | "tyres"
  | "handlebar"
  | "seatpost"
  | "pedals"
  | "main_colour"
  | "accent_colour"
  | "finish_type";

/** The guided configurator visits categories in this order. */
export const CATEGORY_ORDER: readonly Category[] = [
  "chassis",
  "wheel_size",
  "frame_size",
  "fork",
  "motor",
  "battery",
  "brakes",
  "brake_disc",
  "tyres",
  "handlebar",
  "seatpost",
  "pedals",
  "main_colour",
  "accent_colour",
  "finish_type",
] as const;

export const CATEGORY_LABELS: Record<Category, string> = {
  chassis: "Chassis",
  wheel_size: "Wheel Size",
  frame_size: "Frame Size",
  fork: "Suspension Fork",
  motor: "Motor",
  battery: "Battery",
  brakes: "Brakes",
  brake_disc: "Brake Discs",
  tyres: "Tyres",
  handlebar: "Handlebar",
  seatpost: "Seatpost",
  pedals: "Pedals / Pegs",
  main_colour: "Main Colour",
  accent_colour: "Accent Colour",
  finish_type: "Finish",
};

export type FrameType = "hardtail" | "full_suspension";

export const FRAME_TYPE_LABELS: Record<FrameType, string> = {
  hardtail: "Hardtail",
  full_suspension: "Full-Suspension",
};

export type MotorType = "hub" | "mid_drive";

export interface Component {
  id: string;
  lineId: string;
  category: Category;
  name: string;
  description?: string;
  /** Added to the running total when selected. Category defaults are usually 0. */
  priceDeltaCents: number;

  /** CHASSIS ONLY: the frame type this chassis is. */
  frameType?: FrameType;
  /** NON-CHASSIS: frame types this component works with. `undefined` = all. */
  compatibleFrameTypes?: FrameType[];
  /** Motor drive types this component works with (e.g. foot pegs need a hub). */
  compatibleMotorTypes?: MotorType[];

  /** MOTOR ONLY: drive type. */
  motorType?: MotorType;
  /** BATTERY: nominal voltage. Must be one the selected motor accepts. */
  voltage?: number;
  /** MOTOR ONLY: battery voltages this controller safely accepts. */
  acceptedVoltages?: number[];

  /** A hex colour, for swatch categories (main/accent colour). */
  swatch?: string;

  /** Compositing base layer image. */
  layerAsset: string;
  /** Dedicated close-up asset for the zoom interaction (where applicable). */
  closeupAsset?: string;

  isDefault: boolean;
  sortOrder: number;

  /** Visible but not yet purchasable — shown disabled with a "coming soon" badge
   *  and rejected by checkout re-validation. Kept in the data model so it can be
   *  switched on later without a rebuild. */
  comingSoon?: boolean;
}

/** Optional multi-select add-on, priced on top of the build. */
export interface Extra {
  id: string;
  lineId: string;
  name: string;
  description?: string;
  priceDeltaCents: number;
  /** If set, only offered when the selected chassis frame matches. */
  compatibleFrameTypes?: FrameType[];
  /** Emphasised note (e.g. usage caveat). */
  note?: string;
  sortOrder: number;
}

/** Arbitrary incompatible pair not derivable from attributes. Symmetric. */
export interface IncompatibilityRule {
  a: string;
  b: string;
  reason: string;
}

export interface ProductLine {
  id: string;
  slug: string;
  name: string;
  description?: string;
  /** Starting price of a base build, before positive component deltas. */
  basePriceCents: number;
  /** ISO 4217 currency for display/formatting. */
  currency: string;
}

/** A "Rider's Choice" preset: a named, complete, editable build at a price tier. */
export interface Preset {
  id: string;
  lineId: string;
  tier: number; // 1 = entry, 2 = mid, 3 = flagship
  name: string;
  tagline?: string;
  heroAsset?: string;
  /** One component id per category. */
  componentIds: string[];
  /** Preselected extras. */
  extraIds?: string[];
  sortOrder: number;
}

/** A build in progress: at most one selected component id per category. */
export type Selection = Partial<Record<Category, string>>;

/** Selected optional add-ons (ids into Catalog.extras). */
export type ExtraSelection = string[];

/** Everything the engines need to reason about a line. */
export interface Catalog {
  line: ProductLine;
  components: Component[];
  extras: Extra[];
  incompatibilities: IncompatibilityRule[];
  presets: Preset[];
}
