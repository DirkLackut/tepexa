import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { cargarAlturas } from "./alturas.js";

/**
 * Terreno real de la región a partir del manifiesto de GET /regions/{id}/terrain.
 *  - lod: "desktop" (2001 × 1501) o "mobile" (1001 × 751), de manifiesto.lods.
 *  - paso: usar 1 de cada `paso` píxeles (2 = 4 veces menos triángulos). Para celulares: lod "mobile" y paso 2.
 *  - transformacion: la de crearTransformacion(manifiesto, exageración). La misma para rutas y puntos.
 * Va dentro de <Suspense> (la textura se carga con useTexture).
 */
export function TerrenoJezero({ manifiesto, transformacion, lod = "mobile", paso = 1, onListo }) {
  const nivel = manifiesto.lods.find((l) => l.recommended_for === lod) ?? manifiesto.lods[0];
  const [alturas, setAlturas] = useState(null);
  const [error, setError] = useState(null);
  const textura = useTexture(manifiesto.texture.url);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 8;

  useEffect(() => {
    let vivo = true;
    cargarAlturas(nivel.heightmap_url, manifiesto.z_min_m, manifiesto.z_max_m)
      .then((a) => vivo && setAlturas(a))
      .catch((e) => vivo && setError(e));
    return () => { vivo = false; };
  }, [nivel.heightmap_url, manifiesto.z_min_m, manifiesto.z_max_m]);

  const geometria = useMemo(() => {
    if (!alturas) return null;
    const { ancho, alto, z } = alturas;
    const { min_x, min_y, max_x, max_y } = manifiesto.extent;
    const cols = Math.floor((ancho - 1) / paso) + 1;
    const filas = Math.floor((alto - 1) / paso) + 1;
    const pos = new Float32Array(cols * filas * 3);
    const uv = new Float32Array(cols * filas * 2);
    for (let f = 0; f < filas; f++) {
      const py = f * paso;                                   // fila de la imagen (0 = norte)
      const y = max_y - (py / (alto - 1)) * (max_y - min_y);
      for (let c = 0; c < cols; c++) {
        const px = c * paso;
        const x = min_x + (px / (ancho - 1)) * (max_x - min_x);
        const [sx, sy, sz] = transformacion.aEscena(x, y, z[py * ancho + px]);
        const i = f * cols + c;
        pos.set([sx, sy, sz], i * 3);
        uv.set([px / (ancho - 1), 1 - py / (alto - 1)], i * 2);
      }
    }
    const indices = new Uint32Array((cols - 1) * (filas - 1) * 6);
    let k = 0;
    for (let f = 0; f < filas - 1; f++) {
      for (let c = 0; c < cols - 1; c++) {
        const a = f * cols + c, b = a + 1, d = a + cols, e = d + 1;
        indices.set([a, d, b, b, d, e], k);
        k += 6;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    g.setIndex(new THREE.BufferAttribute(indices, 1));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }, [alturas, paso, transformacion, manifiesto.extent]);

  useEffect(() => () => geometria?.dispose(), [geometria]);
  useEffect(() => { if (geometria) onListo?.(geometria.index.count / 3); }, [geometria, onListo]);

  if (error) throw error; // lo atrapa el error boundary de la app
  if (!geometria) return null;
  return (
    <mesh geometry={geometria} receiveShadow>
      <meshStandardMaterial map={textura} roughness={1} metalness={0} />
    </mesh>
  );
}
