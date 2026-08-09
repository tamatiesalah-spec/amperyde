// Server-side order re-validation — the price-integrity guard.
//
// The client computes price for instant feedback, but the client is UNTRUSTED:
// a payload can be tampered (wrong total, incompatible / foreign / unknown
// components or extras) and prices can go stale. Before any charge, the server
// recomputes everything from the trusted catalog and rejects anything that
// doesn't reconcile. It never trusts a client-sent total.
//
// Pure and catalog-injected so it is exhaustively unit-testable (checkout.test.ts).
// Async server entry: revalidateOrder() in src/server/revalidateOrder.ts.

import {
  CATEGORY_ORDER,
  type Catalog,
  type Category,
  type Selection,
} from "@/domain/types";
import { buildContext, selectedFrameType, validateBuild } from "@/domain/compatibility";
import { priceSelection, type PriceBreakdown } from "@/domain/pricing";

export interface OrderRequest {
  lineSlug: string;
  componentIds: string[];
  /** Selected optional add-ons. */
  extraIds?: string[];
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
  | { code: "unknown_extra"; extraId: string }
  | { code: "foreign_line_extra"; extraId: string }
  | { code: "extra_frame_incompatible"; extraId: string; reason: string }
  | { code: "price_mismatch"; expectedCents: number; actualCents: number };

export interface OrderValidation {
  ok: boolean;
  errors: OrderError[];
  selection?: Selection;
  extraIds?: string[];
  breakdown?: PriceBreakdown;
  /** The server's authoritative total — the ONLY total safe to charge. */
  totalCents?: number;
}

export function validateOrder(request: OrderRequest, catalog: Catalog): OrderValidation {
  if (catalog.line.slug !== request.lineSlug) {
    return { ok: false, errors: [{ code: "unknown_line", lineSlug: request.lineSlug }] };
  }

  const ctx = buildContext(catalog.components, catalog.incompatibilities);
  const errors: OrderError[] = [];

  // 1. Resolve components to THIS line (reject unknown / foreign / duplicate).
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
  for (const [category, ids] of idsByCategory) {
    if (ids.length > 1) errors.push({ code: "duplicate_category", category, componentIds: ids });
  }

  // 2. Completeness.
  const missing = CATEGORY_ORDER.filter((cat) => !selection[cat]);
  if (missing.length > 0) errors.push({ code: "incomplete_build", missing });

  // 3. Compatibility (re-enforce the UI's gating rules).
  for (const issue of validateBuild(selection, ctx).issues) {
    errors.push({ code: "incompatible", category: issue.category, reason: issue.reason });
  }

  // 4. Resolve extras (reject unknown / foreign / frame-incompatible). De-dupe.
  const extrasById = new Map(catalog.extras.map((e) => [e.id, e]));
  const frame = selectedFrameType(selection, ctx);
  const validExtraIds: string[] = [];
  const seenExtras = new Set<string>();
  for (const id of request.extraIds ?? []) {
    if (seenExtras.has(id)) continue;
    seenExtras.add(id);
    const extra = extrasById.get(id);
    if (!extra) {
      errors.push({ code: "unknown_extra", extraId: id });
      continue;
    }
    if (extra.lineId !== catalog.line.id) {
      errors.push({ code: "foreign_line_extra", extraId: id });
      continue;
    }
    if (extra.compatibleFrameTypes && frame && !extra.compatibleFrameTypes.includes(frame)) {
      errors.push({
        code: "extra_frame_incompatible",
        extraId: id,
        reason: `${extra.name} isn’t available on this frame.`,
      });
      continue;
    }
    validExtraIds.push(id);
  }

  // 5. Authoritative price (components + valid extras). Never trust the client.
  const breakdown = priceSelection(catalog.line, selection, ctx, {
    all: catalog.extras,
    selectedIds: validExtraIds,
  });
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
    extraIds: validExtraIds,
    breakdown,
    totalCents: breakdown.totalCents,
  };
}
