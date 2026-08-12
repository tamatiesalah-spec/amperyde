// Order repository factory. Returns the mock-first local store today; when
// Supabase is wired, return a SupabaseOrderRepository here — callers don't change.

import type { OrderRepository } from "@/server/orders/repository";
import { LocalOrderRepository } from "@/server/orders/localRepository";

let instance: OrderRepository | null = null;

export function getOrderRepository(): OrderRepository {
  if (!instance) {
    // const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    // instance = useSupabase ? new SupabaseOrderRepository() : new LocalOrderRepository();
    instance = new LocalOrderRepository();
  }
  return instance;
}

export type { OrderRepository } from "@/server/orders/repository";
