import Link from "next/link";
import { getOrderRepository } from "@/server/orders";
import { formatMoney } from "@/domain/pricing";
import { BrandLogo } from "@/components/BrandLogo";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

export const metadata = { title: "Orders — AMPERYDE (internal)" };

export default async function OrdersPage() {
  const orders = await getOrderRepository().list();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <Link href="/" aria-label="AMPERYDE home">
          <BrandLogo className="h-14 w-auto" />
        </Link>
        <span className="text-sm text-muted">Internal · Orders</span>
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <p className="eyebrow">Internal · build tracking</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-2 text-sm text-faint">
          Mock data (in-memory) — swappable to Supabase with no UI change. No auth yet: this is a
          staff-facing view and would sit behind authentication in production.
        </p>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-faint">
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Placed</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Pickup</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-line/60 transition hover:bg-surface-2">
                  <td className="px-4 py-3">
                    <Link href={`/orders/${o.id}`} className="font-mono font-medium text-ink hover:text-brand">
                      {o.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(o.createdAt).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-muted">{o.pickup}</td>
                  <td className="px-4 py-3 text-right font-mono text-ink">{formatMoney(o.totalCents, o.currency)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-faint">No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
