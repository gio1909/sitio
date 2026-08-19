/**
 * Tipos geoespaciais compartilhados pela aplicação.
 *
 * Convenção adotada em todo o projeto:
 *  - longitude/latitude em GRAUS decimais (WGS84), não radianos.
 *  - height (altura) em METROS acima do elipsoide/terreno, conforme o campo.
 *  - rotação (heading) em GRAUS, 0 = Norte, sentido horário (igual a bússola),
 *    convertida para radianos apenas na fronteira com a API do Cesium.
 */

/** Uma posição geográfica: longitude, latitude e altura (metros). */
export interface GeoPosition {
  longitude: number;
  latitude: number;
  /** Altura em metros acima do terreno (não acima do elipsoide). */
  height: number;
}

/** Dimensões físicas de uma construção, em metros. */
export interface HouseDimensions {
  width: number; // eixo Leste-Oeste antes da rotação
  length: number; // eixo Norte-Sul antes da rotação
  height: number; // altura das paredes (sem contar o telhado)
}

/** Estado completo de posicionamento/orientação da casa no terreno. */
export interface HouseTransform {
  position: GeoPosition;
  /** Rotação (heading) em graus, 0 = Norte, sentido horário. */
  rotationDeg: number;
  dimensions: HouseDimensions;
}

export type ViewMode = "aerial" | "house";
