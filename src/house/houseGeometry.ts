import * as Cesium from "cesium";
import type { HouseDimensions } from "../types/geo";

/**
 * Geometria procedural de uma casa simples (paredes em caixa + telhado de
 * duas águas), construída em um referencial LOCAL de metros:
 *   X = Leste, Y = Norte, Z = Cima (relativo ao ponto de apoio no chão).
 * O grupo inteiro é depois posicionado no globo aplicando o modelMatrix
 * ENU (East-North-Up) do ponto onde a casa está — ver houseFixedFrame.ts /
 * geoConversion.computeFixedFrameTransform. Assim a geometria não precisa
 * saber nada sobre lon/lat: ela só existe em metros locais.
 */

const ROOF_RIDGE_HEIGHT = 1.6; // metros acima do topo da parede
const ROOF_OVERHANG = 0.4; // metros de beiral além da parede, no eixo Y (comprimento)
// Cores calculadas dentro das funções (não no topo do módulo): no build de
// produção o Cesium é carregado como script externo (window.Cesium) e
// avaliar Cesium.Color no momento em que este módulo é importado pode
// rodar antes desse script terminar de carregar.
const WALL_COLOR = () => Cesium.Color.fromCssColorString("#e8dcc8");
const ROOF_COLOR = () => Cesium.Color.fromCssColorString("#8a4a3a");

function buildWallsInstance(dim: HouseDimensions): Cesium.GeometryInstance {
  const box = Cesium.BoxGeometry.fromDimensions({
    vertexFormat: Cesium.VertexFormat.POSITION_ONLY,
    dimensions: new Cesium.Cartesian3(dim.width, dim.length, dim.height),
  });
  return new Cesium.GeometryInstance({
    geometry: box,
    // A caixa nasce centrada na origem; sobe para que a base fique em z=0.
    modelMatrix: Cesium.Matrix4.fromTranslation(
      new Cesium.Cartesian3(0, 0, dim.height / 2),
    ),
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(WALL_COLOR()),
    },
  });
}

/**
 * Constrói um prisma de telhado de duas águas (gable roof) manualmente a
 * partir de 6 vértices. Cada face é emitida com as duas ordens de winding
 * para não depender de backface culling (deixa a geometria robusta mesmo
 * sendo escrita à mão).
 */
function buildRoofInstance(dim: HouseDimensions): Cesium.GeometryInstance {
  const w = dim.width / 2;
  const l = dim.length / 2 + ROOF_OVERHANG;
  const eaveZ = dim.height;
  const ridgeZ = dim.height + ROOF_RIDGE_HEIGHT;

  // v0..v3 = beiral (eave) nos 4 cantos; v4/v5 = cumeeira (ridge) nas pontas.
  const positions = [
    -w, -l, eaveZ, // v0
    w, -l, eaveZ, // v1
    w, l, eaveZ, // v2
    -w, l, eaveZ, // v3
    0, -l, ridgeZ, // v4
    0, l, ridgeZ, // v5
  ];

  // Emite cada triângulo nas duas ordens de winding (normal robusta sem
  // depender de backface culling correto).
  const tri = (a: number, b: number, c: number) => [a, b, c, a, c, b];
  const indices = [
    ...tri(1, 2, 5), // água leste (quad v1,v2,v5,v4)
    ...tri(1, 5, 4),
    ...tri(3, 0, 4), // água oeste (quad v3,v0,v4,v5)
    ...tri(3, 4, 5),
    ...tri(0, 1, 4), // empena traseira (y = -l)
    ...tri(3, 5, 2), // empena dianteira (y = +l)
  ];

  const attributes = new Cesium.GeometryAttributes();
  attributes.position = new Cesium.GeometryAttribute({
    componentDatatype: Cesium.ComponentDatatype.DOUBLE,
    componentsPerAttribute: 3,
    values: new Float64Array(positions),
  });

  const geometry = new Cesium.Geometry({
    attributes,
    indices: new Uint16Array(indices),
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere: Cesium.BoundingSphere.fromVertices(positions),
  });

  return new Cesium.GeometryInstance({
    geometry,
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(ROOF_COLOR()),
    },
  });
}

export function buildHouseGeometryInstances(
  dim: HouseDimensions,
): Cesium.GeometryInstance[] {
  return [buildWallsInstance(dim), buildRoofInstance(dim)];
}
