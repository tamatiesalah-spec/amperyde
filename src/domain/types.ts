// AMPERYDE domain types — pure, framework-free. Mirrors supabase/migrations.
//
// NON-NEGOTIABLE: these types model the OFF-ROAD line only. The street-legal
// conversion kit is a separate product with its own types/surfaces and must
// never be represented as a mode/variant here.

export type Category =
  | "chassis"
  | "wheels"
  | "motor"
  | "battery"
  | "brakes"
  | "cockpit"
  | "finish";

/** The guided configurator visits categories in this order. */
export const CATEGORY_ORDER: readonly Category[] = [
  "chassis",
  "wheels",
  "motor",
  "battery",
  "brakes",
  "cockpit",
  "finish",
] as const;

export const CATEGORY_LABELS: Record<Category, string> = {
  chassis: "Chassis",
  wheels: "Wheels & Tires",
  motor: "Motor",
  battery: "Battery",
  brakes: "Brakes",
  cockpit: "Cockpit",
  finish: "Finish",
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

  /** MOTOR ONLY: drive type. */
  motorType?: MotorType;
  /** MOTOR + BATTERY: nominal voltage. Battery must match the selected motor. */
  voltage?: number;

  /** Compositing base layer PNG. */
  layerAsset: string;
  /** Dedicated close-up asset for the zoom interaction (where applicable). */
  closeupAsset?: string;

  isDefault: boolean;
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
  sortOrder: number;
}

/** A build in progress: at most one selected component id per category. */
export type Selection = Partial<Record<Category, string>>;

/** Everything the engines need to reason about a line. */
export interface Catalog {
  line: ProductLine;
  components: Component[];
  incompatibilities: IncompatibilityRule[];
  presets: Preset[];
}
