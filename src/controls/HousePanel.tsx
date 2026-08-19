import { useSiteStore } from "../state/useSiteStore";
import { useSceneStore } from "../state/useSceneStore";
import { sampleGroundHeight } from "../utils/geoConversion";

/** Um input numérico rotulado, usado para todos os campos editáveis do painel. */
function NumberField({
  label,
  value,
  unit,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-input-wrap">
        <input
          type="number"
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
        <span className="field-unit">{unit}</span>
      </span>
    </label>
  );
}

export function HousePanel() {
  const house = useSiteStore((s) => s.house);
  const updateHouseTransform = useSiteStore((s) => s.updateHouseTransform);
  const viewer = useSceneStore((s) => s.viewer);

  if (!house) return null;

  // Ao mudar lat/lon manualmente, reamostramos a elevação do terreno no novo
  // ponto para a casa continuar apoiada no relevo real (e não flutuando).
  const setLongitude = (longitude: number) => {
    const groundHeight = viewer
      ? sampleGroundHeight(viewer, longitude, house.position.latitude)
      : null;
    updateHouseTransform({
      position: {
        ...house.position,
        longitude,
        height: groundHeight ?? house.position.height,
      },
    });
  };

  const setLatitude = (latitude: number) => {
    const groundHeight = viewer
      ? sampleGroundHeight(viewer, house.position.longitude, latitude)
      : null;
    updateHouseTransform({
      position: {
        ...house.position,
        latitude,
        height: groundHeight ?? house.position.height,
      },
    });
  };

  const setHeight = (height: number) =>
    updateHouseTransform({ position: { ...house.position, height } });

  const setRotation = (rotationDeg: number) =>
    updateHouseTransform({ rotationDeg: ((rotationDeg % 360) + 360) % 360 });

  const rotateBy = (deltaDeg: number) => setRotation(house.rotationDeg + deltaDeg);

  return (
    <div className="house-panel">
      <h3>Casa</h3>

      <div className="field-group">
        <NumberField label="Latitude" value={house.position.latitude} unit="°" step={0.00001} onChange={setLatitude} />
        <NumberField label="Longitude" value={house.position.longitude} unit="°" step={0.00001} onChange={setLongitude} />
        <NumberField label="Altitude" value={house.position.height} unit="m" step={0.1} onChange={setHeight} />
      </div>

      <div className="field-group">
        <NumberField label="Rotação" value={house.rotationDeg} unit="°" step={1} onChange={setRotation} />
        <div className="rotation-buttons">
          <button onClick={() => rotateBy(-15)}>⟲ -15°</button>
          <button onClick={() => rotateBy(15)}>+15° ⟳</button>
        </div>
      </div>

      <div className="field-group">
        <NumberField
          label="Largura"
          value={house.dimensions.width}
          unit="m"
          step={0.5}
          onChange={(width) => updateHouseTransform({ dimensions: { ...house.dimensions, width: Math.max(1, width) } })}
        />
        <NumberField
          label="Comprimento"
          value={house.dimensions.length}
          unit="m"
          step={0.5}
          onChange={(length) => updateHouseTransform({ dimensions: { ...house.dimensions, length: Math.max(1, length) } })}
        />
        <NumberField
          label="Altura"
          value={house.dimensions.height}
          unit="m"
          step={0.1}
          onChange={(height) => updateHouseTransform({ dimensions: { ...house.dimensions, height: Math.max(1, height) } })}
        />
      </div>
    </div>
  );
}
