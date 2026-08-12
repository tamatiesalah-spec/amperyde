// In-memory OrderRepository — the mock-first store. Seeded with a couple of demo
// orders so the dashboard is populated out of the box.
//
// CAVEAT: this is process-memory. In dev it persists across requests; on a
// serverless host (Netlify) each cold start re-seeds and freshly-created orders
// only live within a warm instance. That's fine for a mock — swap in a
// SupabaseOrderRepository (same interface) for real durability.

import { makeOrderReference, type NewOrder, type Order, type OrderStatus } from "@/domain/order";
import type { OrderRepository } from "@/server/orders/repository";

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const seed: Order[] = [
  {
    id: "seed-order-1",
    reference: "AMP-K7Q2",
    createdAt: daysAgo(9),
    lineSlug: "off-road",
    componentIds: ["chassis-hardtail", "wheel-29", "frame-l", "fork-air-130", "motor-hub-1000", "battery-downtube-48", "brakes-hydraulic", "disc-200", "tyres-dualsport", "bar-riser", "seatpost-suspension", "pedals-standard", "colour-desert-tan", "accent-silver", "finish-matt"],
    extraIds: ["extra-lights", "extra-fenders"],
    totalCents: 308000,
    currency: "EUR",
    pickup: "Rotterdam Centraal",
    status: "in_production",
    customerEmail: "rider1@example.com",
  },
  {
    id: "seed-order-2",
    reference: "AMP-3M9F",
    createdAt: daysAgo(3),
    lineSlug: "off-road",
    componentIds: ["chassis-hardtail", "wheel-mullet", "frame-m", "fork-air-160", "motor-hub-1500", "battery-downtube-52", "brakes-hydraulic", "disc-220", "tyres-supermoto", "bar-riser", "seatpost-rigid", "pedals-standard", "colour-race-red", "accent-gold", "finish-gloss"],
    extraIds: [],
    totalCents: 351000,
    currency: "EUR",
    pickup: "Amsterdam Centraal",
    status: "ready_for_pickup",
    customerEmail: "rider2@example.com",
  },
];

export class LocalOrderRepository implements OrderRepository {
  private orders: Order[] = [...seed];

  async create(input: NewOrder): Promise<Order> {
    const order: Order = {
      id: (globalThis.crypto?.randomUUID?.() ?? `ord-${Date.now()}-${Math.random().toString(36).slice(2)}`),
      reference: makeOrderReference(),
      createdAt: new Date().toISOString(),
      status: "received",
      ...input,
    };
    this.orders.push(order);
    return order;
  }

  async list(): Promise<Order[]> {
    return [...this.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<Order | null> {
    return this.orders.find((o) => o.id === id) ?? null;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const order = this.orders.find((o) => o.id === id);
    if (!order) return null;
    order.status = status;
    return order;
  }
}
