import { create } from "zustand";
import type * as Cesium from "cesium";

/**
 * Estado "imperativo" da cena — coisas que não são dados de domínio (como o
 * transform da casa, que fica em useSiteStore), mas sim referências/estado
 * de interação com o motor 3D. Fica separado do useSiteStore para deixar
 * claro o que é dado geográfico serializável e o que é estado de UI/engine.
 */
interface SceneState {
  viewer: Cesium.Viewer | null;
  /** true = próximo clique no terreno posiciona/reposiciona a casa. */
  isPlacingHouse: boolean;
  isTerrainReady: boolean;

  setViewer: (viewer: Cesium.Viewer | null) => void;
  setPlacingHouse: (placing: boolean) => void;
  setTerrainReady: (ready: boolean) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  viewer: null,
  isPlacingHouse: false,
  isTerrainReady: false,

  setViewer: (viewer) => set({ viewer }),
  setPlacingHouse: (placing) => set({ isPlacingHouse: placing }),
  setTerrainReady: (ready) => set({ isTerrainReady: ready }),
}));
