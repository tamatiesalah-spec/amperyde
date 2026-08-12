// Order model — a placed build, tracked through fulfilment. Pure/framework-free.
// Persistence lives behind OrderRepository (mock-first local store today,
// swappable to Supabase later).

export type OrderStatus = "received" | "in_production" | "ready_for_pickup" | "collected";

export const ORDER_STATUS_ORDER: readonly OrderStatus[] = [
  "received",
  "in_production",
  "ready_for_pickup",
  "collected",
] as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Received",
  in_production: "In production",
  ready_for_pickup: "Ready for pickup",
  collected: "Collected",
};

export interface Order {
  id: string;
  /** Human-friendly reference shown to the customer, e.g. AMP-4F7K. */
  reference: string;
  createdAt: string; // ISO
  lineSlug: string;
  componentIds: string[];
  extraIds: string[];
  totalCents: number;
  currency: string;
  pickup: string;
  status: OrderStatus;
  customerEmail?: string;
}

/** The data needed to place an order (before id/reference/status are assigned). */
export interface NewOrder {
  lineSlug: string;
  componentIds: string[];
  extraIds: string[];
  totalCents: number;
  currency: string;
  pickup: string;
  customerEmail?: string;
}

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

/** A short, human-friendly order reference. */
export function makeOrderReference(): string {
  let s = "";
  for (let i = 0; i < 4; i++) s += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
  return `AMP-${s}`;
}
