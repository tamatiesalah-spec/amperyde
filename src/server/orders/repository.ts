// Order persistence boundary. Callers depend on this interface, never on a
// concrete store — the mock-first local implementation swaps to Supabase later
// with no changes to the checkout flow or the dashboard.

import type { NewOrder, Order, OrderStatus } from "@/domain/order";

export interface OrderRepository {
  create(input: NewOrder): Promise<Order>;
  list(): Promise<Order[]>;
  get(id: string): Promise<Order | null>;
  updateStatus(id: string, status: OrderStatus): Promise<Order | null>;
}
