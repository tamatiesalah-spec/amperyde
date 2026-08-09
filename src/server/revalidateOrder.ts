// Async server entry for order re-validation: loads the trusted catalog via the
// repository, then runs the pure validateOrder guard. The future Stripe route
// calls this and only creates a checkout session when { ok: true }, charging
// `totalCents` (the server figure) — never a client-sent amount.

import { getCatalogRepository } from "@/data";
import { validateOrder, type OrderRequest, type OrderValidation } from "@/domain/checkout";

export async function revalidateOrder(request: OrderRequest): Promise<OrderValidation> {
  const repo = getCatalogRepository();
  const catalog = await repo.getCatalog(request.lineSlug);
  if (!catalog) {
    return { ok: false, errors: [{ code: "unknown_line", lineSlug: request.lineSlug }] };
  }
  return validateOrder(request, catalog);
}
