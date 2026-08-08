// Offline CatalogRepository backed by the typed seed. No network, no accounts.
// Async signatures match the future Supabase implementation exactly.

import type { Catalog } from "@/domain/types";
import { offRoadCatalog } from "@/data/seed/offRoad";
import type { CatalogRepository } from "@/data/repository";

// Only the off-road line exists here by design. The street-legal kit is a
// separate product and is intentionally absent from this catalog registry.
const CATALOGS: Record<string, Catalog> = {
  [offRoadCatalog.line.slug]: offRoadCatalog,
};

export class LocalCatalogRepository implements CatalogRepository {
  async getLine(slug: string) {
    return CATALOGS[slug]?.line ?? null;
  }

  async getCatalog(lineSlug: string) {
    return CATALOGS[lineSlug] ?? null;
  }

  async getComponents(lineId: string) {
    return this.catalogByLineId(lineId)?.components ?? [];
  }

  async getIncompatibilities(lineId: string) {
    return this.catalogByLineId(lineId)?.incompatibilities ?? [];
  }

  async getPresets(lineId: string) {
    return this.catalogByLineId(lineId)?.presets ?? [];
  }

  private catalogByLineId(lineId: string): Catalog | undefined {
    return Object.values(CATALOGS).find((cat) => cat.line.id === lineId);
  }
}
