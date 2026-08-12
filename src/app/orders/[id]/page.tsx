import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderRepository } from "@/server/orders";
import { getCatalogRepository } from "@/data";
import { buildContext } from "@/domain/compatibility";
import { formatMoney } from "@/domain/pricing";
import { CATEGORY_LABELS, CATEGORY_ORDER, type Category } from "@/domain/types";
import { ORDER_STATUS_LABELS, ORDER_STATUS_ORDER } from "@/domain/order";
import { BrandLogo } from "@/components/BrandLogo";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

export const metadata = { title: "Order — AMPERYDE (internal)" };

export default async function OrderDetailPage(props: PageProps<"/orders/[id]">) {
  const { id } = await props.params;
  const order = await getOrderRepository().get(id);
  if (!order) notFound();

  const catalog = await getCatalogRepository().getCatalog(order.lineSlug);
  const ctx = catalog ? buildContext(catalog.components, catalog.incompatibilities) : null;
  const extrasById = new Map((catalog?.extras ?? []).map((e) => [e.id, e]));

  const byCategory = new Map<Category, string>();
  for (const cid of order.componentIds) {
    const comp = ctx?.byId.get(cid);
    if (comp) byCategory.set(comp.category, comp.name);
  }

  const currentIdx = ORDER_STATUS_ORDER.indexOf(order.status);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <Link href="/" aria-label="AMPERYDE home">
          <BrandLogo className="h-14 w-auto" />
        </Link>
        <Link href="/orders" className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
          ← All orders
        </Link>
      </header>

      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Order</p>
            <h1 className="mt-1 font-mono text-3xl font-semibold tracking-tight">{order.reference}</h1>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Status timeline */}
        <ol className="mt-8 grid grid-cols-4 gap-2">
          {ORDER_STATUS_ORDER.map((s, i) => {
            const done = i <= currentIdx;
            return (
              <li key={s} className="flex flex-col gap-2">
                <span className={`h-1 rounded-full ${done ? "bg-brand" : "bg-surface-3"}`} />
                <span className={`text-[11px] ${i === currentIdx ? "text-ink" : done ? "text-muted" : "text-faint"}`}>
                  {ORDER_STATUS_LABELS[s]}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-10 grid gap-8 sm:grid-cols-[1fr_240px]">
          {/* Build */}
          <section>
            <h2 className="text-sm font-semibold text-muted">Build</h2>
            <dl className="mt-3 divide-y divide-line/60 rounded-2xl border border-line">
              {CATEGORY_ORDER.map((cat) => (
                <div key={cat} className="flex justify-between gap-3 px-4 py-2 text-sm">
                  <dt className="text-faint">{CATEGORY_LABELS[cat]}</dt>
                  <dd className="text-right text-ink">{byCategory.get(cat) ?? "—"}</dd>
                </div>
              ))}
            </dl>

            {order.extraIds.length > 0 && (
              <>
                <h2 className="mt-6 text-sm font-semibold text-muted">Extras</h2>
                <ul className="mt-2 rounded-2xl border border-line px-4 py-2 text-sm text-ink">
                  {order.extraIds.map((eid) => (
                    <li key={eid} className="py-1">{extrasById.get(eid)?.name ?? eid}</li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {/* Meta */}
          <aside className="space-y-4 text-sm">
            <Meta label="Total" value={formatMoney(order.totalCents, order.currency)} strong />
            <Meta label="Pickup" value={order.pickup} />
            <Meta label="Email" value={order.customerEmail ?? "—"} />
            <Meta
              label="Placed"
              value={new Date(order.createdAt).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" })}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className={`mt-0.5 ${strong ? "text-xl font-semibold" : "text-ink"}`}>{value}</p>
    </div>
  );
}
