-- AMPERYDE — core data model (Supabase / Postgres).
-- Models the OFF-ROAD MTB build (Q1–Q11 + Extras). The Street Legal Kit is an
-- EXTRA (a pedal conversion + power/speed-limiting docs) that can be added to
-- any build to make it road-legal.

-- ---------------------------------------------------------------------------
-- Enumerated types
-- ---------------------------------------------------------------------------
create type component_category as enum (
  'chassis',
  'wheel_size',
  'frame_size',
  'motor',
  'battery',
  'brakes',
  'brake_disc',
  'tyres',
  'handlebar',
  'seatpost',
  'main_colour',
  'accent_colour',
  'finish_type'
);

create type frame_type as enum ('hardtail', 'full_suspension');
create type motor_type as enum ('hub', 'mid_drive');

-- ---------------------------------------------------------------------------
-- Product line
-- ---------------------------------------------------------------------------
create table product_line (
  id               text primary key,
  slug             text not null unique,
  name             text not null,
  description      text,
  base_price_cents integer not null check (base_price_cents >= 0),
  currency         text not null default 'EUR',
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Components — grouped by category, priced as deltas off the line base price.
-- ---------------------------------------------------------------------------
create table components (
  id                     text primary key,
  line_id                text not null references product_line (id) on delete cascade,
  category               component_category not null,
  name                   text not null,
  description            text,
  price_delta_cents      integer not null default 0,

  frame_type             frame_type,               -- chassis only
  compatible_frame_types frame_type[],             -- non-chassis; null = all
  motor_type             motor_type,               -- motors only
  voltage                integer,                  -- batteries: nominal voltage
  accepted_voltages      integer[],                -- motors: voltages accepted
  swatch                 text,                     -- colour categories

  layer_asset            text not null,
  closeup_asset          text,
  is_default             boolean not null default false,
  sort_order             integer not null default 0,
  created_at             timestamptz not null default now(),

  constraint chassis_has_frame_type check (
    (category = 'chassis' and frame_type is not null)
    or (category <> 'chassis' and frame_type is null)
  ),
  constraint motor_type_only_on_motors check (
    (category = 'motor' and motor_type is not null)
    or (category <> 'motor' and motor_type is null)
  )
);

create index components_line_category_idx on components (line_id, category, sort_order);
create unique index components_one_default_per_category
  on components (line_id, category) where is_default;

-- ---------------------------------------------------------------------------
-- Extras — optional multi-select add-ons priced on top of a build.
-- ---------------------------------------------------------------------------
create table extras (
  id                     text primary key,
  line_id                text not null references product_line (id) on delete cascade,
  name                   text not null,
  description            text,
  price_delta_cents      integer not null default 0,
  compatible_frame_types frame_type[],
  note                   text,
  sort_order             integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Compatibility — explicit gating of invalid component pairings (attribute-
-- derived rules like hub-motor->hardtail are computed by the engine).
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
-- ---------------------------------------------------------------------------
create table presets (
  id         text primary key,
  line_id    text not null references product_line (id) on delete cascade,
  tier       integer not null,
  name       text not null,
  tagline    text,
  hero_asset text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (line_id, tier)
);

create table preset_components (
  preset_id    text not null references presets (id) on delete cascade,
  component_id text not null references components (id) on delete cascade,
  primary key (preset_id, component_id)
);

create table preset_extras (
  preset_id text not null references presets (id) on delete cascade,
  extra_id  text not null references extras (id) on delete cascade,
  primary key (preset_id, extra_id)
);
