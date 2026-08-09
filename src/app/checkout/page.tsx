import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogRepository } from "@/data";
import { buildContext } from "@/domain/compatibility";
import { validateOrder } from "@/domain/checkout";
import { formatMoney } from "@/domain/pricing";
import { CATEGORY_LABELS, type Category } from "@/domain/types";
import { PICKUP_LOCATIONS } from "@/server/checkout";
import { stripeStatus } from "@/server/stripe";
import { BrandLogo } from "@/components/BrandLogo";
import { CheckoutForm } from "./CheckoutForm";

export const metadata = { title: "Checkout — AMPERYDE Off-Road" };

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CheckoutPage(props: PageProps<"/checkout">) {
  const sp = await props.searchParams;
  const catalog = await getCatalogRepository().getCatalog("off-road");
  if (!catalog) notFound();

  const componentIds = str(sp.c).split(",").filter(Boolean);
  const extraIds = str(sp.e).split(",").filter(Boolean);
  const clientTotal = Number(str(sp.t) || 0);
  const ctx = buildContext(catalog.components, catalog.incompatibilities);
  const cur = catalog.line.currency;

  // Authoritative re-validation for display (the same guard runs again on submit).
  const validation = validateOrder(
    { lineSlug: "off-road", componentIds, extraIds, expectedTotalCents: clientTotal },
    catalog,
  );
  const hardErrors = validation.errors.filter((e) => e.code !== "price_mismatch");
  const priceChanged = validation.errors.some((e) => e.code === "price_mismatch");
  const total = validation.totalCents ?? 0;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <Link href="/" aria-label="AMPERYDE home">
          <BrandLogo className="h-14 w-auto" />
        </Link>
        <Link href="/configure" className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
          Back to configurator
        </Link>
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <p className="eyebrow">Checkout</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Review &amp; confirm</h1>

        <div className="mb-6 mt-4 rounded-lg border border-ember/40 bg-ember/10 px-4 py-2 text-xs text-ember">
          <span className="font-semibold uppercase tracking-wide">Private terrain only.</span> This off-road
          bike is not street legal in any configuration.
        </div>

        {hardErrors.length > 0 ? (
          <div className="rounded-2xl border border-ember/40 bg-ember/5 p-6">
            <p className="font-medium text-ember">This build can&apos;t be checked out.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              {hardErrors.map((e, i) => (
                <li key={i}>{describeError(e)}</li>
              ))}
            </ul>
            <Link href="/configure" className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white">
              Return to configurator
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Summary */}
            <section>
              <h2 className="text-sm font-semibold text-muted">Your build</h2>
              <dl className="mt-3 divide-y divide-line/60 rounded-2xl border border-line">
                <Row label="Base build" value={formatMoney(catalog.line.basePriceCents, cur)} />
                {validation.breakdown?.componentItems
                  .filter((li) => li.priceDeltaCents !== 0)
                  .map((li) => (
                    <Row
                      key={li.id}
                      label={`${li.category ? CATEGORY_LABELS[li.category as Category] : ""} · ${li.name}`}
                      value={`+${formatMoney(li.priceDeltaCents, cur)}`}
                    />
                  ))}
                {validation.breakdown?.extraItems.map((li) => (
                  <Row key={li.id} label={`Extra · ${li.name}`} value={`+${formatMoney(li.priceDeltaCents, cur)}`} />
                ))}
                <Row label="Total" value={formatMoney(total, cur)} strong />
              </dl>

              {priceChanged && (
                <p className="mt-3 text-xs text-ember">
                  Note: the price was re-checked and updated to {formatMoney(total, cur)} (the figure carried
                  from the configurator was out of date).
                </p>
              )}
            </section>

            {/* Form */}
            <aside>
              <CheckoutForm
                componentIds={componentIds.join(",")}
                extraIds={extraIds.join(",")}
                totalCents={total}
                totalLabel={formatMoney(total, cur)}
                pickupLocations={[...PICKUP_LOCATIONS]}
                stripeConfigured={stripeStatus().configured}
              />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <dt className={strong ? "font-semibold" : "text-muted"}>{label}</dt>
      <dd className={`font-mono ${strong ? "text-lg font-semibold" : "text-ink"}`}>{value}</dd>
    </div>
  );
}

function describeError(e: { code: string }): string {
  switch (e.code) {
    case "incomplete_build":
      return "The build is missing one or more components.";
    case "incompatible":
      return "The build contains an incompatible combination.";
    case "unknown_component":
    case "unknown_extra":
      return "The build references an item that no longer exists.";
    default:
      return "The build failed validation.";
  }
}
