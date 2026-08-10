import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

// FAQ / support content. Product answers are factual to the current build;
// answers that touch policy or legality (cancellations/refunds, road legality)
// are PLACEHOLDER wording aligned with the Terms draft and pending legal review.

export const metadata = {
  title: "FAQ — AMPERYDE Off-Road",
  description: "Common questions about custom off-road electric bikes: build time, pickup, payment (card & Klarna), legality, and more.",
};

interface QA {
  q: string;
  a: ReactNode;
  placeholder?: boolean;
}

const FAQS: QA[] = [
  {
    q: "How long until my bike is ready?",
    a: "Every bike is custom-built to order after you buy — there's no pre-built stock. The current estimate is around six weeks from order confirmation. It's an estimate, not a guaranteed delivery date, and can vary with component availability and order volume.",
  },
  {
    q: "How do I get my bike — do you ship?",
    a: "Collection only for now, at Den Haag Centraal, Rotterdam Centraal, or Amsterdam Centraal. You choose your pickup location at checkout and we'll let you know when it's ready. No shipping or delivery is offered yet.",
  },
  {
    q: "Are AMPERYDE off-road bikes street legal?",
    a: (
      <>
        No. The off-road line is for private land and designated off-road trails only, and{" "}
        <span className="text-ink">every configuration</span> — pedals or foot pegs — is equally
        private-terrain only. It isn't designed, tested, or certified for public roads. If you want to
        pursue road compliance, that's a separate product — see the{" "}
        <Link href="/conversion-kit" className="text-brand underline underline-offset-2">
          conversion kit
        </Link>
        .
      </>
    ),
  },
  {
    q: "Can I pay in instalments?",
    a: (
      <>
        Yes. At checkout you can pay by <span className="text-ink">card</span> or with{" "}
        <span className="text-ink">Klarna</span> — pay later or split the cost into instalments. Prices
        are shown in euros throughout, and the total is confirmed before payment.
      </>
    ),
  },
  {
    q: "What's the difference between Rider's Choice and Design Your Own?",
    a: (
      <>
        <Link href="/riders-choice" className="text-brand underline underline-offset-2">Rider&apos;s Choice</Link>{" "}
        is three ready-made builds at three tiers — a fast start. Each one opens straight into{" "}
        <Link href="/configure" className="text-brand underline underline-offset-2">Design Your Own</Link>,
        the full step-by-step configurator, where every part is editable.
      </>
    ),
  },
  {
    q: "How do you make sure the build I choose actually works?",
    a: "The configurator won't let you build something incompatible — it gates frame/motor/battery combinations (e.g. hub motors need a hardtail, mid-drives use pedals, and a battery's voltage must match the motor's controller). Your price is also recomputed and re-checked on our server before any payment is taken, so what you see is what you pay.",
  },
  {
    q: "Can I change or cancel my order after buying?",
    placeholder: true,
    a: (
      <>
        Because each bike is custom-built to your specification, we intend to treat orders as final once
        placed, except where the law provides otherwise — this doesn&apos;t affect your statutory rights
        for goods that are defective or not as described. See our{" "}
        <Link href="/terms" className="text-brand underline underline-offset-2">Terms of Service</Link>.
      </>
    ),
  },
  {
    q: "What is the street-legal conversion kit?",
    a: (
      <>
        A separate, standalone product for owners of a pedal-capable e-bike, with parts and documentation
        to help pursue EN 15194 / EPAC pedal-assist compliance. It&apos;s not bundled with or an upgrade to
        the off-road line, and installing it isn&apos;t a guarantee of road legality — you verify compliance
        with your local authorities. More on the{" "}
        <Link href="/conversion-kit" className="text-brand underline underline-offset-2">conversion kit page</Link>.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <Link href="/" aria-label="AMPERYDE home">
          <BrandLogo className="h-14 w-auto" />
        </Link>
        <Link href="/configure" className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
          Design your own →
        </Link>
      </header>

      <div className="mx-auto w-full max-w-3xl px-6 py-14">
        <p className="eyebrow">Support</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Frequently asked questions</h1>

        <div className="mt-10 divide-y divide-line border-y border-line">
          {FAQS.map((item) => (
            <section key={item.q} className="py-6">
              <h2 className="text-lg font-semibold tracking-tight">{item.q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
              {item.placeholder && (
                <p className="mt-2 text-xs text-faint">Policy wording is a placeholder pending legal review.</p>
              )}
            </section>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted">
          Still stuck?{" "}
          <a href="mailto:hello@amperyde.example" className="text-brand underline underline-offset-2">
            Get in touch
          </a>
          .
        </p>
      </div>
    </div>
  );
}
