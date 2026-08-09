// Client-side configurator state. Holds the SELECTION, chosen EXTRAS, and the UI
// cursor; all reasoning (compatibility, pricing) is done by the pure engines,
// called with a CompatContext the caller passes in.

import { create } from "zustand";
import type { Category, Selection } from "@/domain/types";
import {
  applyChange,
  revalidateBuild,
  type CompatContext,
  type SelectionChange,
} from "@/domain/compatibility";

/** UI cursor: one of the guided categories, or the extras panel. */
export type Step = Category | "extras";

export interface ConfiguratorState {
  initialized: boolean;
  selection: Selection;
  extraIds: string[];
  currentStep: Step;
  notices: SelectionChange[];

  initialize: (selection: Selection, extraIds: string[], ctx: CompatContext, startAt?: Step) => void;
  select: (category: Category, componentId: string, ctx: CompatContext) => void;
  toggleExtra: (extraId: string) => void;
  goTo: (step: Step) => void;
  clearNotices: () => void;
}

export const useConfiguratorStore = create<ConfiguratorState>((set) => ({
  initialized: false,
  selection: {},
  extraIds: [],
  currentStep: "chassis",
  notices: [],

  initialize: (selection, extraIds, ctx, startAt = "chassis") => {
    const { selection: valid } = revalidateBuild(selection, ctx);
    set({ initialized: true, selection: valid, extraIds: [...extraIds], currentStep: startAt, notices: [] });
  },

  select: (category, componentId, ctx) =>
    set((state) => {
      const { selection, changes } = applyChange(state.selection, category, componentId, ctx);
      return { selection, notices: changes };
    }),

  toggleExtra: (extraId) =>
    set((state) => ({
      extraIds: state.extraIds.includes(extraId)
        ? state.extraIds.filter((id) => id !== extraId)
        : [...state.extraIds, extraId],
    })),

  goTo: (step) => set({ currentStep: step }),
  clearNotices: () => set({ notices: [] }),
}));
