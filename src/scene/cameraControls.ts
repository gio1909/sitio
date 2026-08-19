import * as Cesium from "cesium";
import type { HouseTransform } from "../types/geo";
import { DEFAULT_AERIAL_HEIGHT, EYE_HEIGHT_M, SITE_REFERENCE } from "../utils/constants";
import { sampleGroundHeightPrecise } from "../utils/geoConversion";

/** Voa a câmera para a visão aérea inicial, centrada no ponto de referência do sítio. */
export function flyToSite(viewer: Cesium.Viewer, durationSeconds = 2): void {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      SITE_REFERENCE.longitude,
      SITE_REFERENCE.latitude,
      DEFAULT_AERIAL_HEIGHT,
    ),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-40),
      roll: 0,
    },
    duration: durationSeconds,
  });
}

/**
 * Move a câmera para "dentro" da casa, na altura aproximada dos olhos,
 * olhando para fora na direção em que a casa está voltada (heading da casa).
 * O usuário continua livre para olhar ao redor com o mouse (controles
 * padrão do Cesium continuam ativos nesse modo).
 */
export async function flyToHouseView(
  viewer: Cesium.Viewer,
  house: HouseTransform,
  durationSeconds = 1.5,
): Promise<void> {
  // Reamostra a elevação com o tile de terreno mais detalhado disponível:
  // a câmera fica muito perto do chão aqui, e o LOD já carregado (usado no
  // resto da aplicação, mais rápido) pode divergir o suficiente da malha
  // realmente renderizada para deixar a câmera "enterrada".
  const preciseGround = await sampleGroundHeightPrecise(
    viewer,
    house.position.longitude,
    house.position.latitude,
  );
  const groundHeight = preciseGround ?? house.position.height;
  const eyeHeight = groundHeight + EYE_HEIGHT_M;
  const destination = Cesium.Cartesian3.fromDegrees(
    house.position.longitude,
    house.position.latitude,
    eyeHeight,
  );
  viewer.camera.flyTo({
    destination,
    orientation: {
      heading: Cesium.Math.toRadians(house.rotationDeg),
      pitch: Cesium.Math.toRadians(0),
      roll: 0,
    },
    duration: durationSeconds,
  });
}

/** Restaura a visão geral aérea (mesmo destino de flyToSite, alias semântico). */
export function resetToAerialView(viewer: Cesium.Viewer): void {
  flyToSite(viewer);
}
