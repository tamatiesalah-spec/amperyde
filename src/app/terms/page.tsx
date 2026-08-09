import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

// PLACEHOLDER COPY — this content is a structural draft derived from
// AMPERYDE_terms_of_service_DRAFT.md. It has NOT been drafted or reviewed by a
// lawyer and must not be relied upon as binding until reviewed by qualified
// legal counsel (Dutch/EU consumer protection, product liability, e-bike
// regulation). Do not treat any of this as final legal language.

export const metadata = { title: "Terms of Service (Draft) — AMPERYDE" };

const SECTIONS: { heading: string; paras: string[] }[] = [
  {
    heading: "1. Orders and Fulfillment",
    paras: [
      "All bikes sold by AMPERYDE are custom-built to order following purchase. No inventory of pre-built units is held.",
      "Estimated fulfillment time is approximately six (6) weeks from order confirmation. This is an estimate, not a guaranteed delivery date, and may vary with component availability and order volume.",
      "Orders are currently pickup only, at Den Haag Centraal, Rotterdam Centraal, or Amsterdam Centraal. No shipping is offered. You select your pickup location at checkout and are notified when your order is ready.",
    ],
  },
  {
    heading: "2. Sales, Cancellations, and Refunds",
    paras: [
      "Because each bike is custom-built to your specification after order placement, AMPERYDE intends to treat sales as final, with no right of cancellation, return, or refund once placed, except where required by applicable law. [Placeholder — requires legal review of the EU Consumer Rights Directive 2011/83/EU Art. 16(c) made-to-specification exemption.]",
      "This does not affect statutory rights that cannot be excluded by agreement, including rights relating to goods that are defective, not as described, or not fit for purpose.",
    ],
  },
  {
    heading: "3. Off-Road Product Line — Use, Liability, and Disclaimer",
    paras: [
      "Bikes sold under the AMPERYDE off-road line are sold exclusively as off-road vehicles, intended for private land or designated off-road trails only. They are not designed, tested, or certified for public roads.",
      "The off-road line offers an ergonomic/mechanical choice between pedals and foot pegs (where applicable — mid-drive motors require pedals). This choice carries NO representation of legal road status. Every configuration is equally and exclusively for private-land/off-road use, is not street legal, and is not represented as being closer to street-legal in any configuration.",
      "You acknowledge that operating the vehicle on public roads may be illegal and is your responsibility; that you assume full responsibility for lawful, safe operation; and that AMPERYDE disclaims liability, to the maximum extent permitted by law, for injury, damage, or legal consequence arising from use. [Placeholder — liability waivers have limits under Dutch/EU law and require legal review.]",
    ],
  },
  {
    heading: "4. Street-Legal Conversion Kit (Separate Product)",
    paras: [
      "The street-legal conversion kit is a separate, standalone product, independent of the off-road bike line. It is not bundled with, cross-sold on, or presented as an upgrade path from the off-road line.",
      "The kit includes components and documentation intended to help you pursue compliance with applicable e-bike regulations (EN 15194 / EPAC: pedal-assist only, 250W continuous, 25km/h cutoff). AMPERYDE does not guarantee that installation results in a road-compliant vehicle in your jurisdiction; you are responsible for verifying compliance with local authorities before road use. [Placeholder — requires legal review.]",
    ],
  },
  {
    heading: "5. General",
    paras: [
      "Governing law, dispute resolution, and standard boilerplate (severability, entire agreement, etc.) to be added during legal review. [Placeholder]",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <Link href="/" aria-label="AMPERYDE home">
          <BrandLogo className="h-14 w-auto" />
        </Link>
        <span className="text-sm text-muted">Terms of Service</span>
      </header>

      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="rounded-2xl border border-ember/40 bg-ember/10 p-5 text-sm text-ember">
          <p className="font-semibold uppercase tracking-wide">Draft — not final</p>
          <p className="mt-1 text-ember/90">
            This is placeholder, structural copy. It has not been reviewed by a lawyer and is not binding
            or legally approved. It must be reviewed by qualified legal counsel before launch.
          </p>
        </div>

        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Terms of Service</h1>

        <div className="mt-8 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.heading}>
              <h2 className="text-lg font-semibold tracking-tight">{s.heading}</h2>
              <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted">
                {s.paras.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
