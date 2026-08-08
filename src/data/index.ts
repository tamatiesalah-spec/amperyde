// Repository factory. Today it returns the offline seed-backed implementation.
// When Supabase env vars are present, return a SupabaseCatalogRepository here
// instead — callers (getCatalogRepository) never change.

import type { CatalogRepository } from "@/data/repository";
import { LocalCatalogRepository } from "@/data/localRepository";

let instance: CatalogRepository | null = null;

export function getCatalogRepository(): CatalogRepository {
  if (!instance) {
    // const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    // instance = useSupabase ? new SupabaseCatalogRepository() : new LocalCatalogRepository();
    instance = new LocalCatalogRepository();
  }
  return instance;
}

export type { CatalogRepository } from "@/data/repository";
