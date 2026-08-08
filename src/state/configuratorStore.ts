// Client-side configurator state. Holds only the SELECTION and UI cursor; all
// reasoning (compatibility, pricing) is done by the pure engines, called with a
// CompatContext the caller passes in. The store never imports the data layer.

import { create } from "zustand";
import type { Category, Selection } from "@/domain/types";
import {
  applyChange,
  revalidateBuild,
  type CompatContext,
  type SelectionChange,
} from "@/domain/compatibility";

export interface ConfiguratorState {
  initialized: boolean;
  selection: Selection;
  currentCategory: Category;
  /** Non-blocking notices from the last cascade (auto-swaps, drops). */
  notices: SelectionChange[];

  /** Seed the store with a full/partial build (defaults or a preset). */
  initialize: (selection: Selection, ctx: CompatContext, startAt?: Category) => void;
  /** User picks a component; cascade + re-price handled by callers via engines. */
  select: (category: Category, componentId: string, ctx: CompatContext) => void;
  goTo: (category: Category) => void;
  clearNotices: () => void;
}

export const useConfiguratorStore = create<ConfiguratorState>((set) => ({
  initialized: false,
  selection: {},
  currentCategory: "chassis",
  notices: [],

  initialize: (selection, ctx, startAt = "chassis") => {
    // Always normalize incoming builds through the engine so presets/defaults
    // land in a guaranteed-valid state.
    const { selection: valid } = revalidateBuild(selection, ctx);
    set({
      initialized: true,
      selection: valid,
      currentCategory: startAt,
      notices: [],
    });
  },

  select: (category, componentId, ctx) =>
    set((state) => {
      const { selection, changes } = applyChange(
        state.selection,
        category,
        componentId,
        ctx,
      );
      return { selection, notices: changes };
    }),

  goTo: (category) => set({ currentCategory: category }),
  clearNotices: () => set({ notices: [] }),
}));
