import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/*
 * Avatar del equipo con piernas y brazos que se mueven, sin rig y sin tocar el .glb.
 *
 * Los avatares de Tripo son una sola malla estática. Todos tienen las mismas proporciones (medidas el 15-nov sobre los 6):
 *   - piernas: por debajo del 33 % de la altura, separadas en x = 0;
 *   - brazos: entre el 38 % y el 66 % de la altura, más allá del 55 % del medio ancho;
 *   - cabeza: por encima del 64 %; miran hacia +z.
 * En el sombreador de vértices, cada región gira alrededor de su articulación (cadera u hombro) con un peso suave,
 * así la malla se dobla sin romperse. Cuesta lo mismo que dibujar el modelo quieto.
 */
const CADERA = 0.33, HOMBRO = 0.6, CABEZA = 0.64;

function parche(uniformes, c) {
  return (sh) => {
    Object.assign(sh.uniforms, uniformes);
    sh.vertexShader =
      `uniform float uFase; uniform float uAmp; uniform float uMinY; uniform float uAlto; uniform float uMedioX; uniform float uCx; uniform float uCz;\n` +
      sh.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        {
          float h = (transformed.y - uMinY) / uAlto;
          float xr = (transformed.x - uCx) / uMedioX;
          float lado = xr >= 0.0 ? 1.0 : -1.0;
          float ax = abs(xr);
          float s = sin(uFase);
          // Piernas: giran en la cadera hacia adelante y atrás, alternadas.
          float wp = (1.0 - smoothstep(${(CADERA - 0.09).toFixed(2)}, ${(CADERA + 0.01).toFixed(2)}, h)) * smoothstep(0.02, 0.12, ax);
          float a = lado * s * 0.5 * uAmp * wp;
          float py = uMinY + ${CADERA.toFixed(2)} * uAlto;
          float dy = transformed.y - py, dz = transformed.z - uCz;
          transformed.y = py + dy * cos(a) - dz * sin(a);
          transformed.z = uCz + dy * sin(a) + dz * cos(a);
          // Brazos: giran en el hombro, opuestos a la pierna del mismo lado.
          float wb = smoothstep(0.52, 0.72, ax) * smoothstep(0.34, 0.42, h) * (1.0 - smoothstep(0.64, 0.70, h));
          float b = -s * 0.45 * uAmp * wb;
          float sx = uCx + lado * 0.5 * uMedioX;
          float dx = transformed.x - sx; dz = transformed.z - uCz;
          transformed.x = sx + dx * cos(b) + dz * sin(b);
          transformed.z = uCz - dx * sin(b) + dz * cos(b);
          // Torso: un leve giro contrario a la cadera.
          float wt = smoothstep(${CADERA.toFixed(2)}, 0.55, h);
          float g = s * 0.07 * uAmp * wt;
          dx = transformed.x - uCx; dz = transformed.z - uCz;
          transformed.x = uCx + dx * cos(g) + dz * sin(g);
          transformed.z = uCz - dx * sin(g) + dz * cos(g);
        }`,
      );
  };
}

/** Casco de burbuja, cuello y mochila (PLSS) medidos sobre el propio modelo. Ilustración: no es un traje de NASA. */
function trajeEVA(copia, malla) {
  const geo = malla.geometry;
  const pos = geo.attributes.position;
  const bb = geo.boundingBox;
  const alto = bb.max.y - bb.min.y, medioX = (bb.max.x - bb.min.x) / 2, cx = (bb.max.x + bb.min.x) / 2;
  const cabeza = new THREE.Box3(), torso = new THREE.Box3(), v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const h = (v.y - bb.min.y) / alto;
    if (h > CABEZA) cabeza.expandByPoint(v);
    else if (h > 0.4 && h < 0.6 && Math.abs(v.x - cx) < 0.45 * medioX) torso.expandByPoint(v);
  }
  // De la geometría al espacio del modelo (el nodo de Tripo trae escala y traslado).
  copia.updateMatrixWorld(true);
  const m = malla.matrixWorld;
  cabeza.applyMatrix4(m); torso.applyMatrix4(m);
  const c = cabeza.getCenter(new THREE.Vector3()), t = cabeza.getSize(new THREE.Vector3());
  const r = Math.max(t.x, t.y, t.z) * 0.56;
  const g = new THREE.Group();
  g.name = "traje-eva";
  const vidrio = new THREE.MeshPhysicalMaterial({
    color: "#e8f4ff", transparent: true, opacity: 0.2, roughness: 0.04, metalness: 0, clearcoat: 1,
    clearcoatRoughness: 0.03, depthWrite: false, envMapIntensity: 1.6,
  });
  const casco = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), vidrio);
  casco.position.copy(c).y += t.y * 0.04;
  casco.renderOrder = 2;
  g.add(casco);
  const visera = new THREE.Mesh(
    new THREE.SphereGeometry(r * 1.01, 48, 16, Math.PI / 2 - 0.95, 1.9, 0.12 * Math.PI, 0.26 * Math.PI),
    new THREE.MeshPhysicalMaterial({ color: "#f3c06b", metalness: 1, roughness: 0.18, transparent: true, opacity: 0.55, depthWrite: false }),
  );
  visera.position.copy(casco.position);
  visera.renderOrder = 3;
  g.add(visera);
  const blanco = new THREE.MeshStandardMaterial({ color: "#f1ede3", roughness: 0.55, metalness: 0.05 });
  const naranja = new THREE.MeshStandardMaterial({ color: "#E8521A", roughness: 0.5 });
  const cuello = new THREE.Mesh(new THREE.TorusGeometry(r * 0.72, r * 0.09, 12, 40), blanco);
  cuello.rotation.x = Math.PI / 2;
  cuello.position.set(c.x, casco.position.y - r * 0.72, c.z);
  g.add(cuello);
  const ts = torso.getSize(new THREE.Vector3());
  const mochila = new THREE.Mesh(new THREE.BoxGeometry(ts.x * 0.85, ts.y * 1.15, r * 0.5), blanco);
  mochila.position.set(c.x, torso.getCenter(v).y + ts.y * 0.08, torso.min.z - r * 0.22);
  g.add(mochila);
  const franja = new THREE.Mesh(new THREE.BoxGeometry(ts.x * 0.86, ts.y * 0.12, r * 0.51), naranja);
  franja.position.copy(mochila.position).y += ts.y * 0.3;
  g.add(franja);
  copia.add(g);
}

/**
 * Avatar animado.
 * - `andar`: ref opcional `{ fase, amp }` que maneja otro componente (el simulador la avanza con la distancia recorrida).
 *   Sin ella, se anima solo: `ritmo = "caminar"` (en el lugar) o `"reposo"` (respiración y brazos sueltos).
 * - `tamano`: altura en unidades de la escena. Apoyado en y = 0 y centrado en x/z.
 * - `traje`: casco, cuello y mochila (vista previa del traje EVA).
 * @param {any} props
 */
export function AvatarArticulado({ modelo, perfil = "movil", tamano = 1, traje = false, andar, ritmo = "caminar", sombras = false, ...props }) {
  const url = (modelo[perfil] ?? modelo.pc).url;
  const { scene } = useGLTF(url);
  const uniformes = useRef({ uFase: { value: 0 }, uAmp: { value: 0 } });
  const cuerpo = useRef();

  const { copia, escala, base } = useMemo(() => {
    const c = scene.clone(true);
    let malla = null;
    c.traverse((o) => {
      if (!o.isMesh) return;
      malla ??= o;
      o.castShadow = sombras;
      o.receiveShadow = sombras;
      const g = o.geometry;
      g.computeBoundingBox();
      const bb = g.boundingBox;
      const u = uniformes.current;
      u.uMinY = { value: bb.min.y };
      u.uAlto = { value: bb.max.y - bb.min.y };
      u.uMedioX = { value: (bb.max.x - bb.min.x) / 2 };
      u.uCx = { value: (bb.max.x + bb.min.x) / 2 };
      u.uCz = { value: (bb.max.z + bb.min.z) / 2 };
      o.material = o.material.clone();
      o.material.onBeforeCompile = parche(u);
      o.material.customProgramCacheKey = () => "tepexa-avatar-articulado";
      o.frustumCulled = false; // el sombreador mueve vértices fuera de la caja original
    });
    if (malla && traje) trajeEVA(c, malla);
    const caja = new THREE.Box3().setFromObject(c);
    const tam = caja.getSize(new THREE.Vector3());
    const centro = caja.getCenter(new THREE.Vector3());
    return { copia: c, escala: tamano / Math.max(tam.y, 1e-6), base: [-centro.x, -caja.min.y, -centro.z] };
  }, [scene, tamano, traje, sombras]);

  useFrame((estado, delta) => {
    const u = uniformes.current;
    const t = estado.clock.elapsedTime;
    let fase, amp;
    if (andar?.current) ({ fase, amp } = andar.current);
    else if (ritmo === "caminar") { fase = t * 2 * Math.PI * 0.9; amp = 1; }
    else { fase = Math.sin(t * 0.8) * 1.2; amp = 0.18; }
    u.uFase.value = fase;
    u.uAmp.value = THREE.MathUtils.damp(u.uAmp.value, amp, 6, delta);
    if (cuerpo.current) {
      // Rebote del paso (dos por ciclo) y respiración.
      cuerpo.current.position.y = (Math.abs(Math.sin(fase)) * 0.025 * u.uAmp.value + Math.sin(t * 1.6) * 0.004) / escala * tamano;
      cuerpo.current.rotation.x = 0.05 * u.uAmp.value;
    }
  });

  return (
    <group {...props} scale={escala}>
      <group ref={cuerpo}>
        <group position={base}><primitive object={copia} /></group>
      </group>
    </group>
  );
}
