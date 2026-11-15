import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/**
 * Dron del equipo (/models/drone) con aleteo. El modelo es una sola malla: las alas se mueven en el sombreador de
 * vértices (todo lo que está más allá del cuerpo en el eje X gira alrededor de una bisagra). Sin tocar el archivo .glb.
 * Devuelve la copia lista para dibujar, la escala para que la envergadura mida `envergadura` y el reloj del aleteo.
 */
export function useDronConAleteo(modelo, envergadura = 0.9) {
  const url = (modelo.movil ?? modelo.pc).url;
  const { scene } = useGLTF(url);
  const uniformes = useRef({ uTiempo: { value: 0 } });
  const { copia, escala } = useMemo(() => {
    const c = scene.clone(true);
    const caja = new THREE.Box3().setFromObject(c);
    const tam = caja.getSize(new THREE.Vector3());
    const centro = caja.getCenter(new THREE.Vector3());
    c.position.sub(centro);                                   // centrado en el origen
    const mitad = tam.x * 0.09;                               // ancho del cuerpo: ~18 % de la envergadura
    c.traverse((o) => {
      if (!o.isMesh) return;
      o.material = o.material.clone();
      o.material.onBeforeCompile = (sh) => {
        sh.uniforms.uTiempo = uniformes.current.uTiempo;
        sh.uniforms.uMitad = { value: mitad };
        sh.uniforms.uCentroX = { value: centro.x };
        sh.vertexShader = "uniform float uTiempo; uniform float uMitad; uniform float uCentroX;\n" + sh.vertexShader.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           float lx = transformed.x - uCentroX;
           float ax = abs(lx) - uMitad;
           if (ax > 0.0) {
             float a = sin(uTiempo * 8.0) * 0.55 + 0.1;          // aleteo: ±31° alrededor de la bisagra
             float s = sign(lx);
             transformed.x = uCentroX + s * (uMitad + ax * cos(a));
             transformed.y += ax * sin(a);
           }`);
      };
      o.material.needsUpdate = true;
    });
    c.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.material.customProgramCacheKey = () => "tepexa-dron-aleteo"; } });
    return { copia: c, escala: envergadura / Math.max(tam.x, 1e-6) };
  }, [scene, envergadura]);
  useFrame((estado) => { uniformes.current.uTiempo.value = estado.clock.elapsedTime; });
  return { copia, escala };
}

/** Dron flotando en su lugar con aleteo (para visores). @param {any} props */
export function DronAnimado({ modelo, envergadura = 3, ...props }) {
  const { copia, escala } = useDronConAleteo(modelo, envergadura);
  const g = useRef();
  useFrame((e) => {
    const t = e.clock.elapsedTime;
    if (!g.current) return;
    g.current.position.y = envergadura * 0.25 + Math.sin(t * 1.4) * envergadura * 0.04;
    g.current.rotation.z = Math.sin(t * 0.9) * 0.06;
  });
  return <group {...props}><group ref={g} scale={escala}><primitive object={copia} /></group></group>;
}
