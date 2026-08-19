import type { HouseDimensions } from "../types/geo";

/**
 * Ponto de referência do sítio (Estr. da Varzinha, 2640 - Itapuã, Viamão - RS).
 * Coordenadas fornecidas pelo usuário — NÃO representam o polígono exato do
 * terreno, apenas o ponto de referência. Os limites reais do terreno devem
 * ser importados posteriormente (GeoJSON/KML) — ver src/map/propertyBoundary.ts.
 */
export const SITE_REFERENCE = {
  longitude: -50.990627,
  latitude: -30.282518,
  label: "Sítio - Estr. da Varzinha, 2640, Itapuã, Viamão - RS",
} as const;

/** Distância inicial da câmera até o sítio na visão aérea (metros). */
export const DEFAULT_AERIAL_HEIGHT = 350;

/** Altura aproximada dos olhos de uma pessoa em pé, em metros. */
export const EYE_HEIGHT_M = 1.7;

/** Dimensões default da casa procedural do MVP (metros). */
export const DEFAULT_HOUSE_DIMENSIONS: HouseDimensions = {
  width: 10,
  length: 8,
  height: 3,
};

/** Caminho onde um modelo GLB real pode ser colocado futuramente. */
export const HOUSE_GLB_URL = "/models/house.glb";
