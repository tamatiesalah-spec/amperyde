# AMPERYDE

Premium e-commerce experience for a custom **off-road electric bike** brand:
a data-driven, compatibility-gated bike configurator with live pricing.

> **Street-legal:** the street-legal conversion kit is a **separate, standalone
> product** ([/conversion-kit](src/app/conversion-kit/page.tsx)), framed on
> EN 15194 / EPAC compliance. It is never bundled with, cross-sold on, or
> presented as an upgrade from the off-road line. **Every** off-road
> configuration — pedals or foot pegs — is **private-terrain only** and not
> street legal, with a prominent no-liability disclaimer. Pricing is in **EUR**.
>
> _(History: an interim step made the kit a configurator extra; that was
> explicitly reversed — it is standalone again.)_
>
> **Placeholders / open decisions** (all flagged in code, pending confirmation):
> - **Prices** — placeholder EUR figures throughout.
> - **Voltage tiers** — engineering-default: 48V universal; 52V only on the
>   1500W hub + TSDZ16. Wrong-voltage battery↔motor is a hard safety gate.
> - **Suspension fork** — placeholder options (100mm Coil / 130mm Air / 160mm
>   Air) and prices; fork-travel↔frame pairing is available on both frames for
>   now (open, like mullet was).
> - **Colour options** (5 main / 4 accent) and **frame sizes** (M/L/XL, no price
>   delta) — placeholder sets.
>
> **Coming soon (not yet purchasable):** the **full-suspension chassis** is flagged
> `comingSoon` — shown disabled in the configurator with a badge, rejected by
> checkout re-validation, and the two full-suspension presets (Ridgeline, Apex)
> are marked "coming soon" on Rider's Choice. Flip `comingSoon` off to launch it.
> (Trailhead is the only immediately-buyable preset for now.)
>
> **Confirmed:** mullet wheels stay available on **both** frames (decided).
> - **Terms of Service** ([/terms](src/app/terms/page.tsx)) — placeholder copy,
>   not approved legal language.

## Status — all 5 build increments complete

Following the brief's build order (data model → configurator → compositing/zoom
→ cinematic hero → checkout):

- ✅ **Data model + compatibility logic** — SQL schema, typed seed, engines, tests
- ✅ **Configurator with live pricing** — 14-step guided flow + multi-select extras
- ✅ **Layered image compositing + zoom interactions** — stacked per-category layers,
  real-time swaps, CSS-transform zoom/pan into each region
- ✅ **Landing-page cinematic scroll-scrub hero** — preloaded canvas image sequence,
  scroll maps to frame index; scroll-triggered reveal sections below
- ✅ **Checkout with server-side price re-validation** — `/checkout` re-validates the
  order (`validateOrder`) before any charge, mandatory T&C acceptance, pickup
  selection, Stripe **test-keys-only** session creation with **card + Klarna**
  (pay later / instalments). Standalone `/terms`, `/conversion-kit`, and `/faq`
  pages (policy/legal copy is placeholder).

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
