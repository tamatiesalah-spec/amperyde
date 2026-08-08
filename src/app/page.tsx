import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

// Landing entry. The cinematic scroll-scrub hero is a later increment; this is a
// clean, on-brand gateway to the two flows. Per the non-negotiable, there is no
// street-legal conversion content or cross-sell anywhere on this page.

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <BrandLogo className="h-8 w-auto" />
        <nav className="flex items-center gap-6 text-sm text-muted">
          <Link href="/riders-choice" className="hover:text-ink">
            Rider&apos;s Choice
          </Link>
          <Link href="/configure" className="hover:text-ink">
            Design Your Own
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col justify-center px-6">
        <div className="mx-auto w-full max-w-6xl">
          <p className="eyebrow">Custom off-road electric</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            Built to your line.
            <br />
            <span className="text-brand">Engineered to order.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            Every AMPERYDE off-road bike is configured, validated, and built for
            one rider. Pick a proven build or start from the chassis.
          </p>

          <div className="mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
            <Link
              href="/riders-choice"
              className="group rounded-2xl border border-line bg-surface p-6 transition hover:border-muted"
            >
              <p className="eyebrow">Start here</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Rider&apos;s Choice
              </h2>
              <p className="mt-1 text-sm text-muted">
                Three fully-configured builds across three tiers.
              </p>
              <span className="mt-4 inline-block text-sm text-brand">Explore builds →</span>
            </Link>

            <Link
              href="/configure"
              className="group rounded-2xl border border-brand/40 bg-brand/[0.03] p-6 transition hover:border-brand"
            >
              <p className="eyebrow">Full control</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Design Your Own
              </h2>
              <p className="mt-1 text-sm text-muted">
                Guided build, live pricing, compatibility handled for you.
              </p>
              <span className="mt-4 inline-block text-sm text-brand">
                Open the configurator →
              </span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="px-6 py-6 text-xs text-faint">
        AMPERYDE Off-Road · Custom electric bikes, built to order.
      </footer>
    </div>
  );
}
