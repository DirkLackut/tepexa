import { Component, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds } from "@react-three/drei";
import { AvatarArticulado } from "../shared/3d/index.js";

export function Minimapa({ rec, extent, estado, paradas, pequeno }) {
  const [w, h] = pequeno ? [104, 78] : [160, 120];
  const X = (x) => ((x - extent[0]) / (extent[2] - extent[0])) * w;
  const Y = (y) => h - ((y - extent[1]) / (extent[3] - extent[1])) * h;
  const linea = rec.pts.map((p, i) => `${i ? "L" : "M"}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join("");
  return (
    <svg width={w} height={h} style={{ display: "block", background: "rgba(232,82,26,.12)", borderRadius: 6 }}>
      <path d={linea} fill="none" stroke="#F1EDE3" strokeWidth={1.5} />
      {paradas.map((p) => <circle key={p.id} cx={X(p.geometry.coordinates[0])} cy={Y(p.geometry.coordinates[1])} r={2.5} fill="#F59E0B" />)}
      {estado && <circle cx={X(estado.p[0])} cy={Y(estado.p[1])} r={4.5} fill="#E8521A" stroke="#fff" strokeWidth={1.5} />}
    </svg>
  );
}

class Silencioso extends Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() { return this.state.error ? null : this.props.children; }
}

/** Retrato del tripulante en el visor: el mismo modelo 3D (cuando lleguen los avatares de Rive, se cambia aquí). */
export function Retrato({ modelo, tam = 96, traje = false }) {
  if (!modelo) return null;
  return (
    <div style={{ width: tam, height: tam, borderRadius: 8, overflow: "hidden", background: "rgba(241,237,227,.08)" }}>
      <Canvas camera={{ position: [0, 1.6, 2.2], fov: 30 }} dpr={[1, 1.5]} gl={{ alpha: true }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[2, 3, 3]} intensity={1.6} />
        <Silencioso><Suspense fallback={null}>
          <Bounds fit clip margin={1.05}><AvatarArticulado key={modelo.id + traje} modelo={modelo} perfil="movil" tamano={2} traje={traje} ritmo="reposo" /></Bounds>
        </Suspense></Silencioso>
      </Canvas>
    </div>
  );
}
