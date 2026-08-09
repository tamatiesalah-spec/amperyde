# AMPERYDE

Premium e-commerce experience for a custom **off-road electric bike** brand:
a data-driven, compatibility-gated bike configurator with live pricing.

> **Street-legal (updated by product decision):** the original brief kept the
> street-legal kit fully separate. Per an explicit later decision, the **Street
> Legal Kit is now an EXTRA add-on** (a pedal conversion + power/speed-limiting
> documentation) that can be added to any build to make it road-legal. A build
> without it is **private-terrain only** and carries a prominent no-liability
> disclaimer, emphasised throughout the configurator. Pricing is in **EUR**.

## Status — build increments 1–4 of 5 complete

Following the brief's build order (data model → configurator → compositing/zoom
→ cinematic hero → checkout):

- ✅ **Data model + compatibility logic** — SQL schema, typed seed, engines, tests
- ✅ **Bare-bones configurator with live pricing** — guided flow
- ✅ **Layered image compositing + zoom interactions** — stacked per-category layers,
  real-time swaps, CSS-transform zoom/pan into each region
- ✅ **Landing-page cinematic scroll-scrub hero** — preloaded canvas image sequence,
  scroll maps to frame index; scroll-triggered reveal sections below
- ⬜ Cart / checkout with server-side price re-validation

### Hero (scroll-scrub)

`ScrollScrubHero` preloads a frame sequence and draws the current frame to a
`<canvas>`, mapping scroll position through a tall sticky container to a frame
index (the "Apple product page" technique — not a video). Redraws happen only on
frame-index change inside one `requestAnimationFrame`; the canvas is DPR-aware
and resize-safe. Frames come from `heroFrameUrl()` — placeholder SVGs generated
by `npm run art:hero`, repointable to real turntable frames / a CDN sequence.

### Compositing & assets

The preview stacks one image layer per category (`src/lib/bikeArt.ts` generates
placeholder SVGs via `npm run art:placeholders`). Asset references are
**source-agnostic** (`src/lib/assets.ts`): a reference resolves to a URL and is
drawn without the renderer knowing whether it points at staged photography, a
render, or a CDN — so imagery migrates category-by-category as a data-only
change. A missing/failed asset falls back to procedural placeholder art.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # engine unit tests (vitest)
npm run build    # production build + typecheck
```

Routes: `/` (landing), `/riders-choice` (3 presets), `/configure` (configurator;
`?preset=<id>` preloads a preset).

## Mock-first data layer

The app runs with **zero external accounts**. Data flows through a repository
interface (`src/data/repository.ts`); today the offline `LocalCatalogRepository`
serves the typed seed. To move to Supabase, apply the SQL and return a Supabase
implementation from `getCatalogRepository()` — no component changes.

- **Schema:** `supabase/migrations/0001_init.sql` (Supabase/Postgres DDL)
- **Seed (source of truth):** `src/data/seed/offRoad.ts`
- **Generated SQL seed:** `supabase/seed.sql` via `npm run db:seed-sql`
- **Env slots:** `.env.example` (Supabase, Stripe, media, email, CMS)

## Architecture

```
src/
  domain/           # pure, framework-free core (no React, no data source)
    types.ts          # Category/Component/Preset/Selection + CATEGORY_ORDER
    compatibility.ts  # gating rules, cascade (applyChange), validation
    pricing.ts        # base price + selected deltas; server-safe
    configurator.ts   # guided-flow helpers (defaults, next/prev step)
    *.test.ts         # 24 unit tests
  data/             # repository interface + offline seed implementation
  state/            # zustand store (selection + UI cursor only)
  components/configurator/  # BikePreview, Configurator, PriceBar
  app/              # /, /riders-choice, /configure
```

### Compatibility engine

Rules are **data-driven** — component ids are never hardcoded in the engine:

1. **Frame-type gating** — a component's `compatibleFrameTypes` must include the
   selected chassis frame. Hub motors carry `['hardtail']`, so this single rule
   delivers *"hub motors only on hardtail chassis."*
2. **Voltage matching** — battery voltage must equal the selected motor's; the
   battery **auto-resolves** when the motor changes.
3. **Explicit incompatibilities** — arbitrary gated pairs (the `compatibility`
   table) for cases not derivable from attributes.

The guided flow gates each step by **earlier** categories only; choosing an
option is always honored and any resulting **later** conflict is resolved by the
cascade (`applyChange`), which surfaces a notice. Pricing is computed
client-side for instant feedback and re-validated server-side before checkout.
