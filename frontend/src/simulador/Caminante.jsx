import { Component, Suspense, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { AvatarArticulado } from "../shared/3d/index.js";
import { estadoEn, puntoADistancia } from "./recorrido.js";

// ×15: una persona de 1.7 m mide ~25 m en el terreno de 4 km. Se ve sin tapar la ruta; la cámara la sigue de cerca.
export const ESCALA_AVATAR = 15;
const MIRAR_ADELANTE_M = 25;   // el rumbo se toma hacia un punto 25 m adelante: la ruta de la API va en rejilla de 10 m
const PASO_MAX_HZ = 2.2;       // a ×300 las piernas no giran como hélice: el paso se limita y los pies se deslizan

class LimiteDeError extends Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() { return this.state.error ? this.props.reemplazo : this.props.children; }
}

function Marcador({ altura }) {
  return <mesh position={[0, altura / 2, 0]}><capsuleGeometry args={[altura * 0.18, altura * 0.6, 4, 12]} /><meshStandardMaterial color="#F1EDE3" /></mesh>;
}

const angulo = (a, b, lambda, dt) => {           // amortiguado por el camino corto entre dos ángulos
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + d * (1 - Math.exp(-lambda * dt));
};

/**
 * Tripulante caminando la ruta. Avanza el reloj de la misión en cada cuadro (por refs, sin re-render), mueve piernas y
 * brazos según la distancia recorrida y publica su pose para el dron y la cámara. La cámara se amortigua: sin saltos.
 */
export function Caminante({ rec, reloj, transformacion, modelo, camara, pose, traje }) {
  const grupo = useRef();
  const { camera, controls } = useThree();
  const altura = 1.7 * ESCALA_AVATAR * transformacion.u * transformacion.exageracion;
  const zancada = altura * 0.9;                   // largo de un ciclo de paso, en unidades de la escena
  const andar = useRef({ fase: 0, amp: 0 });
  const s = useRef({ rumbo: null, rumboCam: null, dPrev: null });
  const v = useMemo(() => ({ cam: new THREE.Vector3(), mirar: new THREE.Vector3() }), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const r = reloj.current;
    if (r.reproduciendo) {
      r.t = Math.min(rec.total, r.t + (dt * r.velocidad) / 60);
      if (r.t >= rec.total) r.reproduciendo = false;
    }
    const e = estadoEn(rec, r.t);
    r.estado = e;
    const [x, y, z] = transformacion.aEscena(e.p[0], e.p[1], e.p[2]);
    const adelante = puntoADistancia(rec, e.d + MIRAR_ADELANTE_M);
    const dx = adelante[0] - e.p[0], dy = adelante[1] - e.p[1];
    const objetivo = Math.hypot(dx, dy) > 1e-3 ? Math.atan2(dx, dy) : (s.current.rumbo ?? 0);  // +y local (norte) = −z escena
    const st = s.current;
    st.rumbo = st.rumbo == null ? objetivo : angulo(st.rumbo, objetivo, 5, dt);
    st.rumboCam = st.rumboCam == null ? st.rumbo : angulo(st.rumboCam, st.rumbo, 1.6, dt);

    // Paso: la fase avanza con la distancia caminada (en la escena), con un tope para velocidades altas.
    const dEsc = st.dPrev == null ? 0 : Math.abs(e.d - st.dPrev) * transformacion.u;
    st.dPrev = e.d;
    const a = andar.current;
    const avanza = r.reproduciendo && dEsc > 0;
    a.fase += Math.min((dEsc / zancada) * 2 * Math.PI, dt * PASO_MAX_HZ * 2 * Math.PI);
    a.amp = avanza ? 1 : 0;

    const fx = Math.sin(st.rumbo), fz = -Math.cos(st.rumbo);
    grupo.current.position.set(x, y, z);
    grupo.current.rotation.y = Math.PI - st.rumbo;
    pose.current = { x, y, z, fx, fz, altura, giro: Math.PI - st.rumbo };

    if (camara === "libre" || !controls) return;
    const cx = Math.sin(st.rumboCam), cz = -Math.cos(st.rumboCam);
    if (camara === "seguir") {
      v.cam.set(x - cx * altura * 3.6, y + altura * 1.8, z - cz * altura * 3.6);
      v.mirar.set(x + cx * altura * 0.8, y + altura * 0.6, z + cz * altura * 0.8);
    } else {
      v.cam.set(x + fx * altura * 0.15, y + altura * 0.92, z + fz * altura * 0.15);
      v.mirar.set(x + cx * altura * 6, y + altura * 0.55, z + cz * altura * 6);
    }
    const k = 1 - Math.exp(-2.5 * dt), km = 1 - Math.exp(-4 * dt);
    camera.position.lerp(v.cam, k);
    controls.target.lerp(v.mirar, km);
    controls.update();
  });

  return (
    <group ref={grupo}>
      <group visible={camara !== "primera"}>
        {modelo ? (
          <LimiteDeError reemplazo={<Marcador altura={altura} />}>
            <Suspense fallback={<Marcador altura={altura} />}>
              <AvatarArticulado key={modelo.id + traje} modelo={modelo} perfil="movil" tamano={altura} traje={traje} andar={andar} />
            </Suspense>
          </LimiteDeError>
        ) : <Marcador altura={altura} />}
      </group>
      <mesh position={[0, altura * 0.03, 0]} rotation-x={-Math.PI / 2}><ringGeometry args={[altura * 0.3, altura * 0.4, 32]} /><meshBasicMaterial color="#E8521A" transparent opacity={0.8} /></mesh>
    </group>
  );
}
