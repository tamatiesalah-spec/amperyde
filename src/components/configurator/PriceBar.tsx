"use client";

// Running price total pinned to the bottom of the configurator. Price is
// computed client-side for instant feedback; it is re-validated server-side
// before checkout (validateOrder).

import { useState } from "react";
import { CATEGORY_LABELS } from "@/domain/types";
import { formatMoney, type PriceBreakdown } from "@/domain/pricing";
import type { BuildValidity } from "@/domain/compatibility";

interface Props {
  price: PriceBreakdown;
  validity: BuildValidity;
}

export function PriceBar({ price, validity }: Props) {
  const [open, setOpen] = useState(false);
  const ready = validity.complete && validity.valid;
  const cur = price.currency;

  return (
    <div className="relative border-t border-line bg-surface/95 backdrop-blur">
      {open && (
        <div className="absolute bottom-full left-0 right-0 max-h-80 overflow-y-auto border-t border-line bg-surface p-5 shadow-2xl">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Base build</span>
              <span className="font-mono">{formatMoney(price.basePriceCents, cur)}</span>
            </div>
            <div className="mt-2 divide-y divide-line/60">
              {price.componentItems
                .filter((li) => li.priceDeltaCents !== 0)
                .map((li) => (
                  <div key={li.id} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-muted">
                      <span className="text-faint">{li.category ? CATEGORY_LABELS[li.category] : ""} · </span>
                      {li.name}
                    </span>
                    <span className="font-mono text-ink">+{formatMoney(li.priceDeltaCents, cur)}</span>
                  </div>
                ))}
            </div>

            {price.extraItems.length > 0 && (
              <>
                <p className="eyebrow mt-4">Extras</p>
                <div className="mt-1 divide-y divide-line/60">
                  {price.extraItems.map((li) => (
                    <div key={li.id} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-muted">{li.name}</span>
                      <span className="font-mono text-ink">+{formatMoney(li.priceDeltaCents, cur)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-baseline gap-3 text-left">
          <span className="eyebrow">Your build</span>
          <span className="text-2xl font-semibold tracking-tight">{formatMoney(price.totalCents, cur)}</span>
          <span className="text-xs text-faint underline-offset-4 hover:underline">{open ? "Hide" : "Breakdown"}</span>
        </button>

        <div className="ml-auto flex items-center gap-4">
          <span className={`hidden text-sm sm:inline ${ready ? "text-brand" : "text-faint"}`}>
            {ready
              ? "Ready to build · private terrain"
              : !validity.complete
                ? "Select every component"
                : validity.issues[0]?.reason ?? "Resolve conflicts"}
          </span>
          <button
            type="button"
            disabled={!ready}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
              ready ? "bg-brand text-white hover:brightness-105" : "cursor-not-allowed bg-surface-3 text-faint"
            }`}
          >
            Continue to checkout
          </button>
        </div>
      </div>
    </div>
  );
}
