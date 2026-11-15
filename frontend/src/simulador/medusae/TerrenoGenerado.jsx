import { useEffect, useMemo } from "react";
import * as THREE from "three";

/*
 * Malla y textura del terreno ILUSTRATIVO de Medusae Fossae (escenario.js).
 * Colores de referencia del depósito claro y polvoriento (no es color real): crestas más claras, corredores con arena
 * más oscura, bandas por capas y relieve sombreado con el sol desde el oeste-noroeste.
 */
function texturaDesde(rej, extent) {
  const { ancho, alto, z, suelto } = rej;
  const c = document.createElement("canvas");
  c.width = ancho; c.height = alto;
  const g = c.getContext("2d");
  const img = g.createImageData(ancho, alto);
  const dx = (extent.max_x - extent.min_x) / (ancho - 1), dy = (extent.max_y - extent.min_y) / (alto - 1);
  const sol = [Math.cos(0.6) * -0.94, Math.sin(0.6), Math.cos(0.6) * 0.34];   // dirección de la luz (x, arriba, sur)
  const at = (cc, ff) => z[Math.min(alto - 1, Math.max(0, ff)) * ancho + Math.min(ancho - 1, Math.max(0, cc))];
  for (let f = 0; f < alto; f++) {
    for (let col = 0; col < ancho; col++) {
      const i = f * ancho + col;
      const zx = (at(col + 1, f) - at(col - 1, f)) / (2 * dx), zy = (at(col, f + 1) - at(col, f - 1)) / (2 * dy);
      const n = [-zx, 1, -zy], ln = Math.hypot(...n);
      const luz = Math.max(0, (n[0] * sol[0] + n[1] * sol[1] + n[2] * sol[2]) / ln);
      const pend = Math.atan(Math.hypot(zx, zy));
      const capas = 0.5 + 0.5 * Math.sin(z[i] * 2 * Math.PI / 3.2);
      const arena = suelto[i];
      let r = arena ? 168 : 214, gg = arena ? 122 : 172, b = arena ? 92 : 138;
      const k = 0.8 + 0.22 * capas * (1 - arena);
      const sh = 0.38 + 0.78 * luz - pend * 0.12;
      img.data[i * 4] = Math.min(255, r * k * sh);
      img.data[i * 4 + 1] = Math.min(255, gg * k * sh);
      img.data[i * 4 + 2] = Math.min(255, b * k * sh);
      img.data[i * 4 + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** @param {any} props */
export function TerrenoGenerado({ rej, manifiesto, transformacion, paso = 1 }) {
  const { geometria, textura } = useMemo(() => {
    const { ancho, alto, z } = rej;
    const { min_x, min_y, max_x, max_y } = manifiesto.extent;
    const cols = Math.floor((ancho - 1) / paso) + 1, filas = Math.floor((alto - 1) / paso) + 1;
    const pos = new Float32Array(cols * filas * 3), uv = new Float32Array(cols * filas * 2);
    for (let f = 0; f < filas; f++) {
      const py = f * paso, y = max_y - (py / (alto - 1)) * (max_y - min_y);
      for (let c = 0; c < cols; c++) {
        const px = c * paso, x = min_x + (px / (ancho - 1)) * (max_x - min_x);
        const i = f * cols + c;
        pos.set(transformacion.aEscena(x, y, z[py * ancho + px]), i * 3);
        uv.set([px / (ancho - 1), 1 - py / (alto - 1)], i * 2);
      }
    }
    const idx = new Uint32Array((cols - 1) * (filas - 1) * 6);
    let k = 0;
    for (let f = 0; f < filas - 1; f++) for (let c = 0; c < cols - 1; c++) {
      const a = f * cols + c, b = a + 1, d = a + cols, e = d + 1;
      idx.set([a, d, b, b, d, e], k); k += 6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return { geometria: g, textura: texturaDesde(rej, manifiesto.extent) };
  }, [rej, manifiesto, transformacion, paso]);
  useEffect(() => () => { geometria.dispose(); textura.dispose(); }, [geometria, textura]);
  return (
    <mesh geometry={geometria} receiveShadow>
      <meshStandardMaterial map={textura} roughness={1} metalness={0} />
    </mesh>
  );
}
