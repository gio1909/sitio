import { useRef } from "react";
import { useSiteStore } from "../state/useSiteStore";
import { useSceneStore } from "../state/useSceneStore";
import { flyToHouseView, flyToSite, resetToAerialView } from "../scene/cameraControls";
import { loadBoundaryFromFile } from "../map/propertyBoundary";

export function Toolbar() {
  const house = useSiteStore((s) => s.house);
  const viewMode = useSiteStore((s) => s.viewMode);
  const setViewMode = useSiteStore((s) => s.setViewMode);
  const removeHouse = useSiteStore((s) => s.removeHouse);

  const viewer = useSceneStore((s) => s.viewer);
  const isPlacingHouse = useSceneStore((s) => s.isPlacingHouse);
  const setPlacingHouse = useSceneStore((s) => s.setPlacingHouse);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddOrMoveHouse = () => {
    setPlacingHouse(!isPlacingHouse);
  };

  const handleHouseView = () => {
    if (!viewer || !house) return;
    if (viewMode === "house") {
      setViewMode("aerial");
      resetToAerialView(viewer);
    } else {
      setViewMode("house");
      void flyToHouseView(viewer, house);
    }
  };

  const handleTerrainView = () => {
    if (!viewer) return;
    setViewMode("aerial");
    resetToAerialView(viewer);
  };

  const handleCenterSite = () => {
    if (!viewer) return;
    setViewMode("aerial");
    flyToSite(viewer);
  };

  const handleRemoveHouse = () => {
    removeHouse();
    setPlacingHouse(false);
  };

  const handleImportBoundary = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !viewer) return;
    await loadBoundaryFromFile(viewer, file);
  };

  return (
    <div className="toolbar">
      <button
        className={isPlacingHouse ? "toolbar-btn active" : "toolbar-btn"}
        onClick={handleAddOrMoveHouse}
        title={house ? "Clique no terreno para mover a casa" : "Clique no terreno para adicionar a casa"}
      >
        🏠 {house ? (isPlacingHouse ? "Clique no terreno…" : "Mover Casa") : isPlacingHouse ? "Clique no terreno…" : "Adicionar Casa"}
      </button>

      <button
        className={viewMode === "house" ? "toolbar-btn active" : "toolbar-btn"}
        onClick={handleHouseView}
        disabled={!house}
        title="Ver o sítio a partir da casa"
      >
        👁 Vista da Casa
      </button>

      <button className="toolbar-btn" onClick={handleTerrainView} title="Voltar para a visão geral em 3D">
        🌎 Vista do Terreno
      </button>

      <button className="toolbar-btn" onClick={handleCenterSite} title="Recentralizar no ponto de referência do sítio">
        📍 Centralizar Sítio
      </button>

      <button
        className="toolbar-btn danger"
        onClick={handleRemoveHouse}
        disabled={!house}
        title="Remover a casa da cena"
      >
        🗑 Remover Casa
      </button>

      <div className="toolbar-sep" />

      <button
        className="toolbar-btn subtle"
        onClick={() => fileInputRef.current?.click()}
        title="Importar limites do terreno (GeoJSON ou KML)"
      >
        📐 Importar Limites
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".geojson,.json,.kml"
        style={{ display: "none" }}
        onChange={handleImportBoundary}
      />
    </div>
  );
}
