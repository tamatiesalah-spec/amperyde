import Link from "next/link";
import { getOrderRepository } from "@/server/orders";
import { formatMoney } from "@/domain/pricing";
import { ORDER_STATUS_LABELS } from "@/domain/order";
import { BrandLogo } from "@/components/BrandLogo";

export const metadata = { title: "Order placed — AMPERYDE" };

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CheckoutSuccessPage(props: PageProps<"/checkout/success">) {
  const sp = await props.searchParams;
  const orderId = str(sp.order);
  const order = orderId ? await getOrderRepository().get(orderId) : null;

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

        {order ? (
          <>
            <div className="mt-6 w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-left">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Order</span>
                <span className="font-mono text-lg font-semibold">{order.reference}</span>
              </div>
              <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
                <Row label="Status" value={ORDER_STATUS_LABELS[order.status]} />
                <Row label="Total" value={formatMoney(order.totalCents, order.currency)} />
                <Row label="Pickup" value={order.pickup} />
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm text-muted">
              We&apos;ll email {order.customerEmail ?? "you"} when it&apos;s ready for collection —
              estimated build time is around six weeks.
            </p>
            <Link href={`/orders/${order.id}`} className="mt-6 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-bright">
              Track this order
            </Link>
          </>
        ) : (
          <p className="mt-4 max-w-md text-muted">
            We&apos;ll email you when your custom off-road bike is ready for collection.
          </p>
        )}

        <Link href="/" className="mt-6 text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
          Back to home
        </Link>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-faint">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
