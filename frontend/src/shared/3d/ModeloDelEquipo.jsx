import { useEffect, useMemo, useState } from "react";
import { Center, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Modelos 3D del equipo (Blender, Tripo) optimizados por pipeline/assets/optimizar.mjs.
// Se leen SIEMPRE desde /models/manifest.json: así un modelo nuevo o cambiado no exige tocar código.
let manifiestoPromesa = null;
export function cargarManifiestoModelos(url = "/models/manifest.json") {
  manifiestoPromesa ??= fetch(url).then((r) => {
    if (!r.ok) throw new Error("No se encontró /models/manifest.json");
    return r.json();
  });
  return manifiestoPromesa;
}

/** "movil" en celulares o pantallas chicas, "pc" en el resto. */
export const perfilDelDispositivo = () =>
  typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768) ? "movil" : "pc";

/** Hook: lista de modelos utilizables del manifiesto (los que fallaron al optimizarse se omiten). */
export function useModelosDelEquipo() {
  /** @type {[any[] | null, Function]} */
  const [modelos, setModelos] = useState(/** @type {any[] | null} */ (null));
  const [error, setError] = useState(null);
  useEffect(() => {
    cargarManifiestoModelos()
      .then((m) => setModelos(Object.entries(m.models).filter(([, v]) => v.ok).map(([id, v]) => ({ id, ...v }))))
      .catch(setError);
  }, []);
  return { modelos, error };
}

/**
 * Carga un modelo del equipo, lo centra en X/Z, lo apoya en y = 0 y lo escala para que su lado mayor mida `tamano` unidades.
 * Debe ir dentro de <Suspense> (mientras carga) y de un error boundary (si el archivo falla): la app sigue.
 * useGLTF de drei ya descomprime meshopt.
 */
/** @param {any} props */
export function ModeloDelEquipo({ modelo, perfil = perfilDelDispositivo(), tamano = 4, sombras = true, ...props }) {
  const url = (modelo[perfil] ?? modelo.pc).url;
  const { scene } = useGLTF(url);
  const { copia, escala } = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = sombras;
        o.receiveShadow = sombras;
        // En celulares la transmisión (vidrio, agua) es muy costosa: se reemplaza por transparencia simple.
        if (perfil === "movil" && o.material?.transmission > 0) {
          o.material = o.material.clone();
          o.material.transmission = 0;
          o.material.transparent = true;
          o.material.opacity = 0.75;
        }
      }
    });
    const caja = new THREE.Box3().setFromObject(c);
    const lado = caja.getSize(new THREE.Vector3());
    return { copia: c, escala: tamano / Math.max(lado.x, lado.y, lado.z, 1e-6) };
  }, [scene, tamano, sombras, perfil]);
  return (
    <group {...props} scale={escala}>
      <Center top>
        <primitive object={copia} />
      </Center>
    </group>
  );
}
