-- AMPERYDE — core data model (Supabase / Postgres)
-- Increment 1: models/presets, components, compatibility.
--
-- NON-NEGOTIABLE: the off-road line and the street-legal conversion kit are
-- SEPARATE, non-cross-marketed products. This schema models the OFF-ROAD line
-- only. The street-legal kit lives in its own line row + its own surfaces and
-- must never be joined into off-road presets, configurator flows, or carts.
-- There is deliberately no shared "mode" toggle in the data model.

-- ---------------------------------------------------------------------------
-- Enumerated types
-- ---------------------------------------------------------------------------

-- Ordered guided-flow categories. Order is enforced in app code (see
-- src/domain/types.ts CATEGORY_ORDER); Postgres enums preserve declaration order.
create type component_category as enum (
  'chassis',
  'wheels',
  'motor',
  'battery',
  'brakes',
  'cockpit',
  'finish'
);

create type frame_type as enum (
  'hardtail',
  'full_suspension'
);

create type motor_type as enum (
  'hub',
  'mid_drive'
);

-- ---------------------------------------------------------------------------
-- Product line (off-road)
-- ---------------------------------------------------------------------------
create table product_line (
  id               text primary key,
  slug             text not null unique,
  name             text not null,
  description      text,
  -- Starting price of a base build (before any positive component deltas).
  base_price_cents integer not null check (base_price_cents >= 0),
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Components — grouped by category, priced as deltas off the line base price.
-- ---------------------------------------------------------------------------
create table components (
  id                    text primary key,
  line_id               text not null references product_line (id) on delete cascade,
  category              component_category not null,
  name                  text not null,
  description           text,
  -- Amount added to the running total when this option is selected. The
  -- default option in a category is typically 0.
  price_delta_cents     integer not null default 0,

  -- CHASSIS ONLY: the frame type this chassis is. Null for non-chassis rows.
  frame_type            frame_type,

  -- NON-CHASSIS: frame types this component is compatible with. Null = all.
  compatible_frame_types frame_type[],

  -- MOTORS: drive type + nominal voltage. Batteries carry voltage too so the
  -- pack can be matched to the motor ("voltage auto-resolves from motor").
  motor_type            motor_type,
  voltage               integer,

  -- Compositing: base layer PNG for this option, and (where applicable) a
  -- dedicated close-up asset used by the zoom interaction in the configurator.
  layer_asset           text not null,
  closeup_asset         text,

  is_default            boolean not null default false,
  sort_order            integer not null default 0,
  created_at            timestamptz not null default now(),

  -- Only chassis rows carry a frame_type; only chassis rows omit compatibility.
  constraint chassis_has_frame_type check (
    (category = 'chassis' and frame_type is not null)
    or (category <> 'chassis' and frame_type is null)
  ),
  -- Only motors carry motor_type.
  constraint motor_type_only_on_motors check (
    (category = 'motor' and motor_type is not null)
    or (category <> 'motor' and motor_type is null)
  )
);

create index components_line_category_idx on components (line_id, category, sort_order);

-- Exactly one default option per (line, category) keeps the configurator able
-- to open a valid base build and lets presets/pricing resolve deterministically.
create unique index components_one_default_per_category
  on components (line_id, category)
  where is_default;

-- ---------------------------------------------------------------------------
-- Compatibility — explicit gating of invalid component pairings.
--
-- Attribute-derived rules (hub motor -> hardtail only, battery voltage must
-- match motor voltage, frame-type compatibility) are computed from the columns
-- above by the engine. This table captures ARBITRARY incompatible pairs that
-- aren't expressible from attributes alone (e.g. a specific cockpit that fouls
-- a specific battery mount). Symmetric: (a,b) implies (b,a).
-- ---------------------------------------------------------------------------
create table compatibility (
  component_a text not null references components (id) on delete cascade,
  component_b text not null references components (id) on delete cascade,
  reason      text not null,
  primary key (component_a, component_b),
  constraint no_self_pair check (component_a <> component_b)
);

-- ---------------------------------------------------------------------------
-- Presets / models — "Rider's Choice" fully-configured builds by price tier.
-- A preset is a named complete Build; opening one seeds the Design Your Own
-- flow, fully editable from there.
-- ---------------------------------------------------------------------------
create table presets (
  id           text primary key,
  line_id      text not null references product_line (id) on delete cascade,
  tier         integer not null,               -- 1 = entry, 2 = mid, 3 = flagship
  name         text not null,
  tagline      text,
  hero_asset   text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  unique (line_id, tier)
);

-- One selected component per category for each preset.
create table preset_components (
  preset_id    text not null references presets (id) on delete cascade,
  component_id text not null references components (id) on delete cascade,
  primary key (preset_id, component_id)
);
