import * as Cesium from "cesium";

/**
 * Limites do terreno (polígono real do sítio).
 *
 * As coordenadas fornecidas pelo usuário são apenas um PONTO de referência,
 * não o polígono do terreno — não temos (e não inventamos) os limites
 * exatos. Este módulo permite importar o polígono real depois, a partir de
 * um arquivo GeoJSON ou KML (ex.: exportado do Google Earth, INCRA/SIGEF,
 * ou desenhado em um editor externo como geojson.io).
 *
 * Uso futuro: <input type="file" accept=".geojson,.json,.kml" onChange=...>
 * chamando loadBoundaryFromFile(viewer, file).
 */
let activeBoundary: Cesium.DataSource | null = null;

export async function loadBoundaryFromFile(
  viewer: Cesium.Viewer,
  file: File,
): Promise<void> {
  if (activeBoundary) {
    viewer.dataSources.remove(activeBoundary, true);
    activeBoundary = null;
  }

  const isKml = file.name.toLowerCase().endsWith(".kml");
  const dataSource = isKml
    ? await Cesium.KmlDataSource.load(file, {
        camera: viewer.scene.camera,
        canvas: viewer.scene.canvas,
        clampToGround: true,
      })
    : await Cesium.GeoJsonDataSource.load(JSON.parse(await file.text()), {
        stroke: Cesium.Color.fromCssColorString("#ffd23c"),
        fill: Cesium.Color.fromCssColorString("#ffd23c").withAlpha(0.15),
        strokeWidth: 3,
        clampToGround: true,
      });

  activeBoundary = dataSource;
  await viewer.dataSources.add(dataSource);
  await viewer.flyTo(dataSource);
}

export function clearBoundary(viewer: Cesium.Viewer): void {
  if (activeBoundary) {
    viewer.dataSources.remove(activeBoundary, true);
    activeBoundary = null;
  }
}
