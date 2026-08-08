// Pricing engine — pure. Total = line base price + sum of selected component
// price deltas. Computed client-side for instant feedback; the SAME function
// runs server-side to re-validate the price before checkout.

import { CATEGORY_ORDER, type Category, type ProductLine, type Selection } from "@/domain/types";
import type { CompatContext } from "@/domain/compatibility";

export interface PriceLineItem {
  category: Category;
  componentId: string;
  name: string;
  priceDeltaCents: number;
}

export interface PriceBreakdown {
  basePriceCents: number;
  lineItems: PriceLineItem[];
  totalCents: number;
}

export function priceSelection(
  line: ProductLine,
  selection: Selection,
  ctx: CompatContext,
): PriceBreakdown {
  const lineItems: PriceLineItem[] = [];
  let total = line.basePriceCents;

  for (const category of CATEGORY_ORDER) {
    const id = selection[category];
    if (!id) continue;
    const comp = ctx.byId.get(id);
    if (!comp) continue;
    lineItems.push({
      category,
      componentId: comp.id,
      name: comp.name,
      priceDeltaCents: comp.priceDeltaCents,
    });
    total += comp.priceDeltaCents;
  }

  return { basePriceCents: line.basePriceCents, lineItems, totalCents: total };
}

/** USD formatting from integer cents. */
export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
