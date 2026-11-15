import { Html } from "@react-three/drei";

/** Marcador de un punto de interés de GET /regions/{id}/pois (GeoJSON Point en metros locales). */
/** alto: altura del poste en unidades de escena; factor: tamaño de la etiqueta (menor = más chica de cerca). */
export function PuntoDeInteres({ punto, transformacion, idioma = "es", color = "#ffffff", alto = 0.6, factor = 18 }) {
  const [x, y] = punto.geometry.coordinates;
  const z = punto.properties.elevation_m;
  const [sx, sy, sz] = transformacion.aEscena(x, y, z);
  return (
    <group position={[sx, sy, sz]}>
      <mesh position={[0, alto / 2, 0]}>
        <cylinderGeometry args={[alto * 0.033, alto * 0.033, alto, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, alto, 0]}>
        <sphereGeometry args={[alto * 0.15, 16, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Html position={[0, alto * 1.4, 0]} center distanceFactor={factor} style={{ pointerEvents: "none" }}>
        <div style={{ background: "rgba(10,12,16,.78)", color: "#fff", padding: "2px 6px", borderRadius: 4,
                      font: "600 12px system-ui", whiteSpace: "nowrap" }}>
          {punto.properties.name[idioma]}
        </div>
      </Html>
    </group>
  );
}
