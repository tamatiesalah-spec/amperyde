# AMPERYDE

Premium e-commerce experience for a custom **off-road electric bike** brand:
a data-driven, compatibility-gated bike configurator with live pricing.

> **Non-negotiable:** the off-road line and the street-legal conversion kit are
> separate, non-cross-marketed products on separate surfaces. There is no shared
> mode/toggle, no cross-sell, and no bundling anywhere in the UI, data model, or
> checkout. This repo currently models the **off-road line only**.

## Status — build increment 1 of 5

Following the brief's build order (data model → configurator → compositing/zoom
→ cinematic hero → checkout):

- ✅ **Data model + compatibility logic** — SQL schema, typed seed, engines, tests
- ✅ **Bare-bones configurator with live pricing** — guided flow, no bike art yet
- ⬜ Layered image compositing + zoom interactions
- ⬜ Landing-page cinematic scroll-scrub hero
- ⬜ Cart / checkout with server-side price re-validation

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
