import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { ScrollScrubHero } from "@/components/hero/ScrollScrubHero";
import { Reveal } from "@/components/Reveal";

// Landing. A cinematic canvas scroll-scrub hero (placeholder frames) over
// scroll-triggered reveal sections. Per the non-negotiable, there is no
// street-legal conversion content or cross-sell anywhere on this page.

const PILLARS = [
  {
    step: "01",
    title: "Choose your chassis",
    body: "Alloy or carbon, hardtail or full-suspension. Every later choice is validated against it.",
  },
  {
    step: "02",
    title: "Dial the powertrain",
    body: "Hub or mid-drive, matched to a battery that resolves to the right voltage automatically.",
  },
  {
    step: "03",
    title: "Make it yours",
    body: "Wheels, brakes, cockpit, finish — swapped live, priced instantly, built to order.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Persistent brand header */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-4">
        <Link href="/" aria-label="AMPERYDE home">
          <BrandLogo className="h-7 w-auto" />
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted">
          <Link href="/riders-choice" className="transition hover:text-ink">
            Rider&apos;s Choice
          </Link>
          <Link href="/configure" className="transition hover:text-ink">
            Design Your Own
          </Link>
        </nav>
      </header>

      {/* Cinematic hero */}
      <ScrollScrubHero heightVh={340}>
        <p className="eyebrow">Custom off-road electric</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[1.03] tracking-tight sm:text-7xl">
          Built to your line.
          <br />
          <span className="text-brand">Engineered to order.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
          Every AMPERYDE off-road bike is configured, validated, and built for one rider.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/riders-choice"
            className="rounded-full border border-line bg-surface/60 px-6 py-3 text-sm font-semibold text-ink backdrop-blur transition hover:border-muted"
          >
            Explore builds
          </Link>
          <Link
            href="/configure"
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-bright"
          >
            Design your own →
          </Link>
        </div>
      </ScrollScrubHero>

      {/* Content below the hero */}
      <div className="relative z-10 bg-bg">
        {/* Pillars */}
        <section className="mx-auto w-full max-w-6xl px-6 py-28">
          <Reveal>
            <p className="eyebrow">The build, guided</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              A configurator that won&apos;t let you build something that doesn&apos;t work.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {PILLARS.map((p, i) => (
              <Reveal key={p.step} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-line bg-surface p-7">
                  <span className="font-mono text-sm text-brand">{p.step}</span>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Brand story teaser */}
        <section className="border-y border-line bg-surface/40">
          <div className="mx-auto w-full max-w-6xl px-6 py-28">
            <Reveal>
              <p className="eyebrow">Our story</p>
              <p className="mt-5 max-w-3xl text-2xl font-medium leading-snug tracking-tight sm:text-3xl">
                We build off-road electric bikes the way race teams build machines — one
                rider, one spec, no compromises. Not a catalog. A commission.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Final CTA — the two flows */}
        <section className="mx-auto w-full max-w-6xl px-6 py-28">
          <Reveal>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/riders-choice"
                className="group rounded-2xl border border-line bg-surface p-8 transition hover:border-muted"
              >
                <p className="eyebrow">Start here</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Rider&apos;s Choice</h3>
                <p className="mt-1 text-sm text-muted">
                  Three fully-configured builds across three tiers.
                </p>
                <span className="mt-4 inline-block text-sm text-brand">Explore builds →</span>
              </Link>
              <Link
                href="/configure"
                className="group rounded-2xl border border-brand/40 bg-brand/[0.04] p-8 transition hover:border-brand"
              >
                <p className="eyebrow">Full control</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">Design Your Own</h3>
                <p className="mt-1 text-sm text-muted">
                  Guided build, live pricing, compatibility handled for you.
                </p>
                <span className="mt-4 inline-block text-sm text-brand">Open the configurator →</span>
              </Link>
            </div>
          </Reveal>
        </section>

        <footer className="border-t border-line px-6 py-8 text-center text-xs text-faint">
          AMPERYDE Off-Road · Custom electric bikes, built to order.
        </footer>
      </div>
    </div>
  );
}
