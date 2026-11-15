import { Html } from "@react-three/drei";

/** Marcador de un punto de interés de GET /regions/{id}/pois (GeoJSON Point en metros locales). */
export function PuntoDeInteres({ punto, transformacion, idioma = "es", color = "#ffffff" }) {
  const [x, y] = punto.geometry.coordinates;
  const z = punto.properties.elevation_m;
  const [sx, sy, sz] = transformacion.aEscena(x, y, z);
  const alto = 0.6;
  return (
    <group position={[sx, sy, sz]}>
      <mesh position={[0, alto / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, alto, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, alto, 0]}>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Html position={[0, alto + 0.25, 0]} center distanceFactor={18} style={{ pointerEvents: "none" }}>
        <div style={{ background: "rgba(10,12,16,.78)", color: "#fff", padding: "2px 6px", borderRadius: 4,
                      font: "600 12px system-ui", whiteSpace: "nowrap" }}>
          {punto.properties.name[idioma]}
        </div>
      </Html>
    </group>
  );
}
