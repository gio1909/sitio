import * as Cesium from "cesium";
import type { HouseTransform } from "../types/geo";
import { computeFixedFrameTransform } from "../utils/geoConversion";
import { buildHouseGeometryInstances } from "./houseGeometry";
import { HOUSE_GLB_URL } from "../utils/constants";

/**
 * HouseModel — abstração da "casa" na cena 3D.
 *
 * Hoje ela desenha uma casa procedural simples (paredes + telhado de duas
 * águas) construída em src/house/houseGeometry.ts. A ideia é que, quando
 * houver um modelo arquitetônico real, baste colocar um arquivo em
 * `public/models/house.glb` — esta classe detecta o arquivo automaticamente
 * (via HEAD request) e passa a carregá-lo com Cesium.Model no lugar da
 * geometria procedural, sem exigir mudanças em nenhum outro componente.
 */
export class HouseModel {
  private viewer: Cesium.Viewer;
  private primitive: Cesium.Primitive | null = null;
  private model: Cesium.Model | null = null;
  private glbAvailable: boolean | null = null; // null = ainda não verificado

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  private async checkGlbAvailable(): Promise<boolean> {
    if (this.glbAvailable !== null) return this.glbAvailable;
    try {
      const res = await fetch(HOUSE_GLB_URL, { method: "HEAD" });
      this.glbAvailable = res.ok;
    } catch {
      this.glbAvailable = false;
    }
    return this.glbAvailable;
  }

  /** Remove qualquer representação atual da casa da cena (sem apagar o estado). */
  private clearScenePrimitives(): void {
    if (this.primitive) {
      this.viewer.scene.primitives.remove(this.primitive);
      this.primitive = null;
    }
    if (this.model) {
      this.viewer.scene.primitives.remove(this.model);
      this.model = null;
    }
  }

  /** (Re)desenha a casa na cena a partir do transform atual. */
  async update(transform: HouseTransform): Promise<void> {
    const modelMatrix = computeFixedFrameTransform(
      transform.position.longitude,
      transform.position.latitude,
      transform.position.height,
      transform.rotationDeg,
    );

    const hasGlb = await this.checkGlbAvailable();
    this.clearScenePrimitives();

    if (hasGlb) {
      this.model = this.viewer.scene.primitives.add(
        await Cesium.Model.fromGltfAsync({
          url: HOUSE_GLB_URL,
          modelMatrix,
          scale: 1.0,
        }),
      );
      return;
    }

    // Fallback: geometria procedural (sempre disponível, zero dependências externas).
    this.primitive = this.viewer.scene.primitives.add(
      new Cesium.Primitive({
        geometryInstances: buildHouseGeometryInstances(transform.dimensions),
        appearance: new Cesium.PerInstanceColorAppearance({
          flat: true,
          translucent: false,
        }),
        modelMatrix,
        asynchronous: false,
      }),
    );
  }

  /** Remove a casa da cena por completo. */
  remove(): void {
    this.clearScenePrimitives();
  }

  destroy(): void {
    this.remove();
  }
}
