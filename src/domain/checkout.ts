// Server-side order re-validation — the price-integrity guard.
//
// The client computes price for instant feedback, but the client is UNTRUSTED:
// a payload can be tampered (wrong total, incompatible or foreign components,
// unknown ids) and prices can go stale between load and checkout. Before any
// charge is created, the server recomputes everything from the trusted catalog
// and rejects anything that doesn't reconcile. This is the one path where a bug
// means someone pays the wrong amount, so it never trusts a client-sent number.
//
// Pure and catalog-injected so it is exhaustively unit-testable (see
// checkout.test.ts). The async server entry is revalidateOrder() in
// src/server/revalidateOrder.ts.

import {
  CATEGORY_ORDER,
  type Catalog,
  type Category,
  type Selection,
} from "@/domain/types";
import { buildContext, validateBuild } from "@/domain/compatibility";
import { priceSelection, type PriceBreakdown } from "@/domain/pricing";

export interface OrderRequest {
  /** Which product line the client thinks it is buying from. */
  lineSlug: string;
  /** Client-submitted selection (one component id per category, ideally). */
  componentIds: string[];
  /** Client-claimed total, in cents. Used ONLY to detect tampering/staleness. */
  expectedTotalCents: number;
}

export type OrderError =
  | { code: "unknown_line"; lineSlug: string }
  | { code: "unknown_component"; componentId: string }
  | { code: "foreign_line_component"; componentId: string }
  | { code: "duplicate_category"; category: Category; componentIds: string[] }
  | { code: "incomplete_build"; missing: Category[] }
  | { code: "incompatible"; category: Category; reason: string }
  | { code: "price_mismatch"; expectedCents: number; actualCents: number };

export interface OrderValidation {
  ok: boolean;
  errors: OrderError[];
  /** Authoritative, server-computed values (present once the line resolves). */
  selection?: Selection;
  breakdown?: PriceBreakdown;
  /** The server's authoritative total — the ONLY total safe to charge. */
  totalCents?: number;
}

/**
 * Re-validate an untrusted order against a trusted catalog. Returns ok only when
 * every component resolves to this line, the build is complete and compatible,
 * and the client's expected total exactly equals the server-recomputed total.
 */
export function validateOrder(request: OrderRequest, catalog: Catalog): OrderValidation {
  if (catalog.line.slug !== request.lineSlug) {
    return { ok: false, errors: [{ code: "unknown_line", lineSlug: request.lineSlug }] };
  }

  const ctx = buildContext(catalog.components, catalog.incompatibilities);
  const errors: OrderError[] = [];

  // 1. Resolve every submitted id to a component of THIS line. Unknown ids and
  //    components belonging to another line (e.g. a cross-line/street-legal part
  //    smuggled in) are rejected — never silently dropped.
  const selection: Selection = {};
  const idsByCategory = new Map<Category, string[]>();
  for (const id of request.componentIds) {
    const comp = ctx.byId.get(id);
    if (!comp) {
      errors.push({ code: "unknown_component", componentId: id });
      continue;
    }
    if (comp.lineId !== catalog.line.id) {
      errors.push({ code: "foreign_line_component", componentId: id });
      continue;
    }
    const list = idsByCategory.get(comp.category) ?? [];
    list.push(id);
    idsByCategory.set(comp.category, list);
    selection[comp.category] = id;
  }

  // 2. Reject duplicate selections within a category (two chassis, etc.).
  for (const [category, ids] of idsByCategory) {
    if (ids.length > 1) errors.push({ code: "duplicate_category", category, componentIds: ids });
  }

  // 3. Completeness — every category must be chosen.
  const missing = CATEGORY_ORDER.filter((c) => !selection[c]);
  if (missing.length > 0) errors.push({ code: "incomplete_build", missing });

  // 4. Compatibility — the same engine rules that gate the UI, re-enforced here
  //    in case a payload bypassed the UI (hub motor on full-suspension, a
  //    battery that doesn't match the motor voltage, gated pairs, etc.).
  for (const issue of validateBuild(selection, ctx).issues) {
    errors.push({ code: "incompatible", category: issue.category, reason: issue.reason });
  }

  // 5. Authoritative price. Recompute from the trusted catalog and compare to
  //    the client's claim. A mismatch means tampering OR a stale client price;
  //    either way we refuse and hand back the real total to re-confirm.
  const breakdown = priceSelection(catalog.line, selection, ctx);
  if (breakdown.totalCents !== request.expectedTotalCents) {
    errors.push({
      code: "price_mismatch",
      expectedCents: request.expectedTotalCents,
      actualCents: breakdown.totalCents,
    });
  }

  return {
    ok: errors.length === 0,
    errors,
    selection,
    breakdown,
    totalCents: breakdown.totalCents,
  };
}
