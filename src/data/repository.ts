// Catalog data-access boundary. Components/engines depend on this interface,
// never on a concrete data source. The offline implementation reads the typed
// seed; a Supabase implementation can be dropped in later with zero changes to
// callers (see getCatalogRepository()).

import type { Catalog, Component, IncompatibilityRule, Preset, ProductLine } from "@/domain/types";

export interface CatalogRepository {
  getLine(slug: string): Promise<ProductLine | null>;
  getCatalog(lineSlug: string): Promise<Catalog | null>;
  getComponents(lineId: string): Promise<Component[]>;
  getIncompatibilities(lineId: string): Promise<IncompatibilityRule[]>;
  getPresets(lineId: string): Promise<Preset[]>;
}
