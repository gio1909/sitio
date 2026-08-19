import * as Cesium from "cesium";
import { SITE_REFERENCE } from "../utils/constants";

/**
 * Marcador do ponto de referência do sítio. Usa HeightReference.CLAMP_TO_GROUND
 * para que o ponto "grude" no terreno independente da altitude local exata —
 * não precisamos amostrar a elevação manualmente para um billboard/point.
 */
export function addSiteMarker(viewer: Cesium.Viewer): Cesium.Entity {
  return viewer.entities.add({
    name: SITE_REFERENCE.label,
    position: Cesium.Cartesian3.fromDegrees(
      SITE_REFERENCE.longitude,
      SITE_REFERENCE.latitude,
    ),
    point: {
      pixelSize: 14,
      color: Cesium.Color.fromCssColorString("#ff5a3c"),
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text: "Sítio",
      font: "600 14px sans-serif",
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -18),
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });
}
