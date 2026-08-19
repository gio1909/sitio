import * as Cesium from "cesium";
import type { HouseTransform } from "../types/geo";
import { DEFAULT_AERIAL_HEIGHT, EYE_HEIGHT_M, SITE_REFERENCE } from "../utils/constants";

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
export function flyToHouseView(
  viewer: Cesium.Viewer,
  house: HouseTransform,
  durationSeconds = 1.5,
): void {
  const eyeHeight = house.position.height + EYE_HEIGHT_M;
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
