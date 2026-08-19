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
 * Margem extra além da altura dos olhos, somada por segurança na Vista da
 * Casa. A malha de terreno é uma aproximação (mesmo no LOD mais detalhado);
 * perto do chão, uma pequena diferença entre a altura amostrada e a altura
 * do triângulo realmente renderizado é suficiente para a câmera ficar
 * "dentro" do terreno. Sem essa margem, o Cesium desenha a cor de subsolo
 * (undergroundColor) em vez da cena.
 */
const GROUND_CLEARANCE_MARGIN_M = 5;

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
  const eyeHeight = groundHeight + EYE_HEIGHT_M + GROUND_CLEARANCE_MARGIN_M;
  console.debug("[flyToHouseView]", {
    storedHeight: house.position.height,
    preciseGround,
    groundHeight,
    eyeHeight,
  });
  const destination = Cesium.Cartesian3.fromDegrees(
    house.position.longitude,
    house.position.latitude,
    eyeHeight,
  );

  // Desliga o teste de profundidade contra o terreno enquanto estivermos na
  // Vista da Casa: mesmo com a reamostragem acima, uma pequena divergência
  // entre a altura amostrada e a malha renderizada é o suficiente para a
  // câmera ficar "dentro" do terreno e a tela ficar tomada pela cor de
  // subsolo. Sem esse teste, o pior caso vira uma leve sobreposição visual
  // em vez de a cena inteira sumir.
  viewer.scene.globe.depthTestAgainstTerrain = false;

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
  viewer.scene.globe.depthTestAgainstTerrain = true;
  flyToSite(viewer);
}
