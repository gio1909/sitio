import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { useSiteStore } from "../state/useSiteStore";
import { useSceneStore } from "../state/useSceneStore";
import { addSiteMarker } from "../map/siteMarker";
import { HouseModel } from "../house/HouseModel";
import { flyToSite } from "./cameraControls";
import { sampleGroundHeight } from "../utils/geoConversion";

const ION_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN as string | undefined;

/**
 * Componente raiz da cena 3D. Responsável por:
 *  - criar/destruir o Cesium.Viewer (terreno + imagens de satélite);
 *  - manter o marcador do sítio;
 *  - sincronizar a casa (HouseModel) com o estado global (useSiteStore);
 *  - tratar cliques no terreno quando o modo "posicionar casa" está ativo.
 *
 * O Cesium é uma biblioteca imperativa (não-React); por isso o padrão aqui é
 * criar o viewer uma única vez em um useEffect e expô-lo via useSceneStore
 * para que outros componentes React (Toolbar, HousePanel) possam chamar
 * métodos de câmera nele.
 */
export function CesiumViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const houseModelRef = useRef<HouseModel | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (ION_TOKEN) {
      Cesium.Ion.defaultAccessToken = ION_TOKEN;
    }

    let cancelled = false;
    let viewer: Cesium.Viewer | null = null;
    let clickHandler: Cesium.ScreenSpaceEventHandler | null = null;

    async function init() {
      // Terrain.fromWorldTerrain() retorna um objeto `Terrain` (wrapper
      // assíncrono) que o construtor do Viewer aceita diretamente — evita
      // ter que aguardar a promise do provider antes de criar o Viewer.
      const terrain = ION_TOKEN
        ? Cesium.Terrain.fromWorldTerrain({ requestVertexNormals: true })
        : undefined;

      const v = new Cesium.Viewer(containerRef.current!, {
        terrain,
        baseLayer: ION_TOKEN
          ? Cesium.ImageryLayer.fromWorldImagery({})
          : new Cesium.ImageryLayer(
              new Cesium.OpenStreetMapImageryProvider({
                url: "https://tile.openstreetmap.org/",
              }),
            ),
        // Interface limpa: desliga os widgets padrão do Cesium; a nossa
        // própria Toolbar/HousePanel substitui essas funções.
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        selectionIndicator: false,
        infoBox: false,
      });

      if (cancelled) {
        v.destroy();
        return;
      }

      v.scene.globe.enableLighting = true;
      v.scene.globe.depthTestAgainstTerrain = true;
      v.scene.screenSpaceCameraController.minimumZoomDistance = 3;
      v.scene.screenSpaceCameraController.maximumZoomDistance = 20000;

      addSiteMarker(v);
      flyToSite(v, 0);

      houseModelRef.current = new HouseModel(v);
      const existingHouse = useSiteStore.getState().house;
      if (existingHouse) {
        void houseModelRef.current.update(existingHouse);
      }

      clickHandler = new Cesium.ScreenSpaceEventHandler(v.scene.canvas);
      clickHandler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const { isPlacingHouse, setPlacingHouse } = useSceneStore.getState();
        if (!isPlacingHouse) return;

        const cartesian = v.scene.pickPosition(movement.position) ??
          v.camera.pickEllipsoid(movement.position, v.scene.globe.ellipsoid);
        if (!cartesian) return;

        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const longitude = Cesium.Math.toDegrees(cartographic.longitude);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude);
        const groundHeight = sampleGroundHeight(v, longitude, latitude) ?? 0;

        const { house, addHouseAt, moveHouseTo } = useSiteStore.getState();
        if (house) {
          moveHouseTo(longitude, latitude, groundHeight);
        } else {
          addHouseAt(longitude, latitude, groundHeight);
        }
        setPlacingHouse(false);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      viewer = v;
      useSceneStore.getState().setViewer(v);
      useSceneStore.getState().setTerrainReady(true);
    }

    init().catch((error: unknown) => {
      console.error("Falha ao inicializar o Cesium:", error);
      useSceneStore.getState().setInitError(
        error instanceof Error ? error.message : String(error),
      );
    });

    return () => {
      cancelled = true;
      clickHandler?.destroy();
      houseModelRef.current?.destroy();
      houseModelRef.current = null;
      useSceneStore.getState().setViewer(null);
      viewer?.destroy();
    };
  }, []);

  // Mantém a representação 3D da casa sincronizada com o estado global
  // sempre que a posição/rotação/dimensões mudam.
  useEffect(() => {
    const unsubscribe = useSiteStore.subscribe((state, prevState) => {
      if (state.house === prevState.house) return;
      const model = houseModelRef.current;
      if (!model) return;
      if (state.house) {
        void model.update(state.house);
      } else {
        model.remove();
      }
    });
    return unsubscribe;
  }, []);

  return <div ref={containerRef} className="cesium-container" />;
}
