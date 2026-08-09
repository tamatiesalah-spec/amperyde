import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { getCatalogRepository } from "@/data";
import { buildContext, selectionFromComponentIds } from "@/domain/compatibility";
import { priceSelection, formatMoney } from "@/domain/pricing";
import { CATEGORY_LABELS, type Category } from "@/domain/types";

// Headline specs shown on each preset card (the full 13 live in the configurator).
const SPEC_CATS: Category[] = ["chassis", "wheel_size", "motor", "battery", "brakes", "tyres"];

export const metadata = {
  title: "Rider's Choice — AMPERYDE Off-Road",
};

export default async function RidersChoicePage() {
  const repo = getCatalogRepository();
  const catalog = await repo.getCatalog("off-road");
  if (!catalog) notFound();

  const ctx = buildContext(catalog.components, catalog.incompatibilities);
  const presets = [...catalog.presets].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <Link href="/" aria-label="AMPERYDE home">
          <BrandLogo className="h-14 w-auto" />
        </Link>
        <Link
          href="/configure"
          className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Design your own →
        </Link>
      </header>

      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <p className="eyebrow">Rider&apos;s Choice</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Three builds, dialed in.
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Fully-configured off-road builds at three tiers. Ride one as-is, or open
          it into the configurator and make it yours.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {presets.map((preset) => {
            const selection = selectionFromComponentIds(preset.componentIds, ctx);
            const price = priceSelection(catalog.line, selection, ctx, {
              all: catalog.extras,
              selectedIds: preset.extraIds ?? [],
            });
            const featured = preset.tier === 3;
            return (
              <div
                key={preset.id}
                className={`flex flex-col rounded-2xl border p-6 ${
                  featured ? "border-brand/40 bg-brand/[0.03]" : "border-line bg-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="eyebrow">Tier {preset.tier}</p>
                  {featured && (
                    <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
                      Flagship
                    </span>
                  )}
                </div>

                {/* Hero placeholder — real preset photography lands later. */}
                <div className="mt-4 grid aspect-[4/3] place-items-center rounded-xl border border-line bg-surface-2 text-faint">
                  <span className="text-sm">{preset.name} showcase</span>
                </div>

                <h2 className="mt-5 text-2xl font-semibold tracking-tight">{preset.name}</h2>
                {preset.tagline && (
                  <p className="mt-1 text-sm text-muted">{preset.tagline}</p>
                )}

                <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
                  {SPEC_CATS.map((cat) => {
                    const id = selection[cat];
                    const comp = id ? ctx.byId.get(id) : undefined;
                    return (
                      <div key={cat} className="flex justify-between gap-3">
                        <dt className="text-faint">{CATEGORY_LABELS[cat]}</dt>
                        <dd className="truncate text-right text-muted">{comp?.name ?? "—"}</dd>
                      </div>
                    );
                  })}
                  {preset.extraIds && preset.extraIds.length > 0 && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-faint">Extras</dt>
                      <dd className="truncate text-right text-muted">{preset.extraIds.length} included</dd>
                    </div>
                  )}
                </dl>

                <div className="mt-6 flex items-baseline justify-between">
                  <span className="eyebrow">From</span>
                  <span className="text-2xl font-semibold tracking-tight">
                    {formatMoney(price.totalCents, catalog.line.currency)}
                  </span>
                </div>

                <Link
                  href={`/configure?preset=${preset.id}`}
                  className={`mt-5 rounded-full px-5 py-2.5 text-center text-sm font-semibold transition ${
                    featured
                      ? "bg-brand text-white hover:brightness-105"
                      : "border border-line text-ink hover:border-muted"
                  }`}
                >
                  Customize this build
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
