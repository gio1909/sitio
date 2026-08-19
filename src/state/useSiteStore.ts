import { create } from "zustand";
import type { HouseTransform, ViewMode } from "../types/geo";
import {
  DEFAULT_HOUSE_DIMENSIONS,
  SITE_REFERENCE,
} from "../utils/constants";

interface SiteState {
  /** Casa atual, ou null se nenhuma casa foi adicionada ainda. */
  house: HouseTransform | null;
  /** Se o painel/gizmo da casa está selecionado para edição. */
  houseSelected: boolean;
  viewMode: ViewMode;
  /** Altura do terreno (metros, elipsoide) sob o ponto de referência do sítio, se já amostrada. */
  siteTerrainHeight: number | null;

  addHouseAt: (longitude: number, latitude: number, terrainHeight: number) => void;
  removeHouse: () => void;
  updateHouseTransform: (partial: Partial<HouseTransform>) => void;
  moveHouseTo: (longitude: number, latitude: number, terrainHeight: number) => void;
  setHouseSelected: (selected: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setSiteTerrainHeight: (height: number) => void;
}

export const useSiteStore = create<SiteState>((set) => ({
  house: null,
  houseSelected: false,
  viewMode: "aerial",
  siteTerrainHeight: null,

  addHouseAt: (longitude, latitude, terrainHeight) =>
    set({
      house: {
        position: { longitude, latitude, height: terrainHeight },
        rotationDeg: 0,
        dimensions: { ...DEFAULT_HOUSE_DIMENSIONS },
      },
      houseSelected: true,
    }),

  removeHouse: () => set({ house: null, houseSelected: false, viewMode: "aerial" }),

  updateHouseTransform: (partial) =>
    set((state) => {
      if (!state.house) return state;
      return {
        house: {
          ...state.house,
          ...partial,
          position: { ...state.house.position, ...partial.position },
          dimensions: { ...state.house.dimensions, ...partial.dimensions },
        },
      };
    }),

  moveHouseTo: (longitude, latitude, terrainHeight) =>
    set((state) => {
      if (!state.house) return state;
      return {
        house: {
          ...state.house,
          position: { longitude, latitude, height: terrainHeight },
        },
      };
    }),

  setHouseSelected: (selected) => set({ houseSelected: selected }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSiteTerrainHeight: (height) => set({ siteTerrainHeight: height }),
}));

export const SITE_CENTER = SITE_REFERENCE;
