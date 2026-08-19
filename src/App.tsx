import { CesiumViewer } from "./scene/CesiumViewer";
import { Toolbar } from "./controls/Toolbar";
import { HousePanel } from "./controls/HousePanel";
import { useSceneStore } from "./state/useSceneStore";
import "./App.css";

export default function App() {
  const isTerrainReady = useSceneStore((s) => s.isTerrainReady);
  const initError = useSceneStore((s) => s.initError);

  if (initError) {
    return (
      <div className="app-root loading-overlay">
        <div className="loading-card" style={{ maxWidth: 560, textAlign: "left" }}>
          <strong>Não foi possível carregar o sítio 3D.</strong>
          <p style={{ color: "#ff8a75", whiteSpace: "pre-wrap" }}>{initError}</p>
          <p>Abra o console do navegador (F12) para mais detalhes e recarregue a página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <CesiumViewer />
      <Toolbar />
      <HousePanel />
      {!isTerrainReady && (
        <div className="loading-overlay">
          <div className="loading-card">Carregando o sítio…</div>
        </div>
      )}
      {!import.meta.env.VITE_CESIUM_ION_TOKEN && (
        <div className="token-warning">
          ⚠ VITE_CESIUM_ION_TOKEN não configurado — rodando sem terreno 3D real
          e sem imagens de satélite (fallback: globo achatado + OpenStreetMap).
          Veja o README para configurar o token gratuito do Cesium ion.
        </div>
      )}
    </div>
  );
}
