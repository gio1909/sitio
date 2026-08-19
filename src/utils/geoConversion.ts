import * as Cesium from "cesium";

/**
 * CONVERSÃO DE COORDENADAS — como funciona neste projeto
 * ---------------------------------------------------------------
 * O Cesium NÃO usa um plano cartesiano local (como o Three.js faria puro).
 * Ele trabalha em um sistema geocêntrico ECEF (Earth-Centered, Earth-Fixed):
 * cada ponto 3D é um Cartesian3 (x, y, z) em metros, com origem no centro
 * da Terra.
 *
 * Fluxo de conversão usado em toda a aplicação:
 *
 *  1. Guardamos a posição "de verdade" da casa/marcadores sempre em
 *     graus decimais (longitude, latitude) + altura em metros — nunca em
 *     coordenadas Cartesian3 cruas. Isso evita erros de precisão numérica
 *     (o ECEF usa números na casa dos milhões de metros; se guardássemos
 *     apenas o Cartesian3 e fizéssemos aritmética nele, perderíamos
 *     precisão de ponto flutuante ao mover objetos poucos metros).
 *
 *  2. Para desenhar, convertemos lon/lat/height -> Cartesian3 com
 *     Cesium.Cartesian3.fromDegrees(longitude, latitude, height).
 *
 *  3. A ALTURA (height) é sempre relativa ao TERRENO, não ao elipsoide.
 *     Por isso, antes de posicionar algo, amostramos a elevação do
 *     terreno naquele ponto (ver sampleTerrainHeight) e somamos a
 *     altura desejada acima do solo. Isso garante que a casa fique
 *     apoiada no relevo real, e não flutuando ou enterrada.
 *
 *  4. ORIENTAÇÃO: a rotação da casa é definida como "heading" (rumo) em
 *     graus, 0° = Norte, sentido horário — a mesma convenção de uma
 *     bússola. Para aplicar isso a um modelo 3D, usamos
 *     Cesium.Transforms.headingPitchRollToFixedFrame, que constrói a
 *     matriz de orientação ENU (East-North-Up) local naquele ponto do
 *     globo e aplica o heading/pitch/roll relativos a essa base local.
 *     Isso é necessário porque em uma esfera não existe um único eixo
 *     "para cima" global — o "up" muda conforme a posição na Terra.
 */

/** Converte graus para radianos (Cesium trabalha internamente em radianos). */
export function degToRad(deg: number): number {
  return Cesium.Math.toRadians(deg);
}

/**
 * Constrói a matriz de transformação (posição + orientação) de um objeto
 * a partir de longitude/latitude/altura (metros acima do terreno) e um
 * heading em graus. Essa matriz é o que os Cesium Entities/Models esperam
 * para posicionar corretamente um objeto tangente à superfície da Terra
 * naquele ponto, com a rotação correta em torno do eixo "up" local.
 */
export function computeFixedFrameTransform(
  longitude: number,
  latitude: number,
  heightAboveGround: number,
  headingDeg: number,
): Cesium.Matrix4 {
  const position = Cesium.Cartesian3.fromDegrees(
    longitude,
    latitude,
    heightAboveGround,
  );
  const hpr = new Cesium.HeadingPitchRoll(degToRad(headingDeg), 0, 0);
  return Cesium.Transforms.headingPitchRollToFixedFrame(position, hpr);
}

/**
 * Amostra a altura do terreno (metros acima do elipsoide WGS84) em um
 * ponto lon/lat usando a malha de terreno carregada pelo viewer, na maior
 * resolução disponível naquele momento (LOD já baixado). Retorna null se
 * o terreno ainda não está pronto (ex.: terreno "flat" sem provider real).
 *
 * Usar terrainProvider.sampleHeight (síncrono, usa dados já em memória) é
 * suficiente para o MVP; para precisão máxima existe também
 * Cesium.sampleTerrainMostDetailed (assíncrono, força o download do tile
 * mais detalhado) — não usado aqui para manter a interação responsiva.
 */
export function sampleGroundHeight(
  viewer: Cesium.Viewer,
  longitude: number,
  latitude: number,
): number | null {
  const cartographic = Cesium.Cartographic.fromDegrees(longitude, latitude);
  const height = viewer.scene.globe.getHeight(cartographic);
  return height ?? null;
}

/**
 * Versão precisa (assíncrona) de sampleGroundHeight: força o download do
 * tile de terreno mais detalhado disponível para aquele ponto, em vez de
 * usar o LOD que já estiver carregado em memória.
 *
 * Necessário para a "Vista da Casa": a câmera fica muito perto do chão, e
 * um LOD de terreno mais grosseiro (usado pela versão síncrona) pode
 * divergir o suficiente da malha realmente renderizada para colocar a
 * câmera "dentro" do terreno — o Cesium então desenha a cor de subsolo
 * (undergroundColor) em vez da cena, como se estivéssemos debaixo do chão.
 */
export async function sampleGroundHeightPrecise(
  viewer: Cesium.Viewer,
  longitude: number,
  latitude: number,
): Promise<number | null> {
  try {
    const [result] = await Cesium.sampleTerrainMostDetailed(
      viewer.terrainProvider,
      [Cesium.Cartographic.fromDegrees(longitude, latitude)],
    );
    return result.height ?? null;
  } catch {
    return sampleGroundHeight(viewer, longitude, latitude);
  }
}
