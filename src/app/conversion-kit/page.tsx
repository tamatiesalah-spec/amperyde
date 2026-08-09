import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

// STANDALONE product — the street-legal conversion kit. Deliberately separate
// from the off-road line: it is NOT an upgrade path from, add-on to, or related
// product of the off-road bikes, and must never be cross-sold on those surfaces.
// It targets owners of any pedal-capable e-bike.
//
// PLACEHOLDER COPY — compliance wording paraphrases the ToS draft and is NOT
// approved legal language; requires legal review before launch.

export const metadata = {
  title: "Street-Legal Conversion Kit — AMPERYDE",
  description:
    "A conversion kit and documentation to help pursue EN 15194 / EPAC pedal-assist compliance for a pedal-capable e-bike.",
};

const STEPS = [
  {
    title: "Pedal-assist only",
    body: "Removes throttle operation so motor assistance is delivered only while pedalling (EPAC).",
  },
  {
    title: "250W continuous",
    body: "Configures the controller to a 250W continuous rated power output.",
  },
  {
    title: "25 km/h cutoff",
    body: "Sets assistance to cut off at 25 km/h, per EN 15194.",
  },
  {
    title: "Documentation",
    body: "Installation and configuration documentation to support your own compliance checks.",
  },
];

export default function ConversionKitPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <Link href="/" aria-label="AMPERYDE home">
          <BrandLogo className="h-14 w-auto" />
        </Link>
        <span className="text-sm text-muted">Conversion Kit</span>
      </header>

      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <p className="eyebrow">Standalone product</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Street-Legal Conversion Kit
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          A kit and documentation to help owners of a pedal-capable e-bike pursue
          compliance with applicable pedal-assist e-bike regulations
          (EN&nbsp;15194 / EPAC). Sold on its own — it is a separate product with
          its own fitment and support.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {STEPS.map((s) => (
            <div key={s.title} className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="text-lg font-semibold tracking-tight">{s.title}</h2>
              <p className="mt-1.5 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Compliance disclaimer — placeholder, pending legal review. */}
        <div className="mt-10 rounded-2xl border border-ember/40 bg-ember/10 p-6 text-sm text-ember">
          <p className="font-semibold">Important — this is not a guarantee of road legality.</p>
          <p className="mt-2 text-ember/90">
            Installing the kit does not by itself make a vehicle legally
            road-compliant. Compliance depends on correct installation, local
            registration requirements, and other factors outside AMPERYDE&apos;s
            control. You are responsible for verifying compliance with your local
            authorities before any road use. (Placeholder wording — pending legal
            review.)
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <span className="text-2xl font-semibold tracking-tight">Enquire for pricing</span>
          <a
            href="mailto:hello@amperyde.example?subject=Conversion%20Kit%20enquiry"
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-bright"
          >
            Contact us
          </a>
        </div>

        <p className="mt-10 text-xs text-faint">
          See our <Link href="/terms" className="underline underline-offset-4 hover:text-muted">Terms of Service</Link> (draft).
        </p>
      </div>
    </div>
  );
}
