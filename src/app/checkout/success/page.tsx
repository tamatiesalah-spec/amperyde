import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export const metadata = { title: "Order placed — AMPERYDE" };

export default function CheckoutSuccessPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center px-6 py-4">
        <Link href="/" aria-label="AMPERYDE home">
          <BrandLogo className="h-14 w-auto" />
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="eyebrow">Thank you</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Your build is confirmed.</h1>
        <p className="mt-4 max-w-md text-muted">
          We&apos;ll email you when your custom off-road bike is ready for collection at your chosen
          pickup location. Estimated build time is around six weeks.
        </p>
        <Link href="/" className="mt-8 rounded-full border border-line px-6 py-3 text-sm font-semibold text-ink hover:border-muted">
          Back to home
        </Link>
      </main>
    </div>
  );
}
