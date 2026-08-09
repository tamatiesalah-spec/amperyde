// Pricing engine — pure. Total = line base price + selected component deltas +
// selected extra deltas. Computed client-side for instant feedback; the SAME
// function runs server-side to re-validate the price before checkout.

import {
  CATEGORY_ORDER,
  type Category,
  type Extra,
  type ProductLine,
  type Selection,
} from "@/domain/types";
import type { CompatContext } from "@/domain/compatibility";

export interface PriceItem {
  kind: "component" | "extra";
  id: string;
  name: string;
  priceDeltaCents: number;
  category?: Category;
}

export interface PriceBreakdown {
  basePriceCents: number;
  componentItems: PriceItem[];
  extraItems: PriceItem[];
  totalCents: number;
  currency: string;
}

export interface ExtrasPricingContext {
  all: Extra[];
  selectedIds: string[];
}

export function priceSelection(
  line: ProductLine,
  selection: Selection,
  ctx: CompatContext,
  extras?: ExtrasPricingContext,
): PriceBreakdown {
  const componentItems: PriceItem[] = [];
  let total = line.basePriceCents;

  for (const category of CATEGORY_ORDER) {
    const id = selection[category];
    if (!id) continue;
    const comp = ctx.byId.get(id);
    if (!comp) continue;
    componentItems.push({
      kind: "component",
      id: comp.id,
      name: comp.name,
      priceDeltaCents: comp.priceDeltaCents,
      category,
    });
    total += comp.priceDeltaCents;
  }

  const extraItems: PriceItem[] = [];
  if (extras) {
    const byId = new Map(extras.all.map((e) => [e.id, e]));
    // De-dupe selected ids, preserve catalog order for a stable breakdown.
    const selected = new Set(extras.selectedIds);
    for (const extra of extras.all) {
      if (!selected.has(extra.id)) continue;
      extraItems.push({
        kind: "extra",
        id: extra.id,
        name: extra.name,
        priceDeltaCents: extra.priceDeltaCents,
      });
      total += extra.priceDeltaCents;
    }
    // Any selected id not in the catalog is ignored here (pricing stays honest);
    // checkout re-validation is what rejects unknown extras.
    void byId;
  }

  return {
    basePriceCents: line.basePriceCents,
    componentItems,
    extraItems,
    totalCents: total,
    currency: line.currency,
  };
}

/** Currency formatting from integer cents (whole units, no decimals). */
export function formatMoney(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
