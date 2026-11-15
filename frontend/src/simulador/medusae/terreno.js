/*
 * Medusae Fossae · TERRENO ILUSTRATIVO (no es un modelo de elevación de NASA).
 *
 * La API todavía no tiene un DTM de Medusae Fossae (pendiente del backend). Para poder simular una caminata en la
 * región de la próxima misión, este archivo genera un campo de yardangs con las formas que describen los estudios
 * de la Formación Medusae Fossae:
 *   - crestas alargadas talladas por el viento, todas con la misma orientación (aquí ONO–ESE, ilustrativa);
 *   - frente romo contra el viento y cola afilada a favor del viento (forma de casco de barco invertido);
 *   - laderas escalonadas por las capas del depósito, que es fino y fácil de erosionar;
 *   - corredores entre crestas con fondo de arena y rizaduras transversales al viento.
 * Tamaños elegidos en el rango de los yardangs de escala de decenas de metros (alto) y cientos de metros (largo).
 * Es determinista: misma semilla, mismo terreno en cualquier equipo. Marco local en metros, igual que Jezero.
 */

export const EXTENT = { min_x: 0, min_y: 0, max_x: 4000, max_y: 3000 };
const RUMBO = (-20 * Math.PI) / 180;          // eje de las crestas (ilustrativo)
const CU = Math.cos(RUMBO), SU = Math.sin(RUMBO);
const SEP = 190;                              // separación media entre crestas (m)

function hash(i, j, s = 0) {
  let h = (i * 374761393 + j * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const suave = (t) => t * t * (3 - 2 * t);
function ruido(x, y, s) {
  const i = Math.floor(x), j = Math.floor(y), fx = suave(x - i), fy = suave(y - j);
  const a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s);
  return (a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy) * 2 - 1;
}
function fbm(x, y, s, oct = 4) {
  let v = 0, a = 0.5, f = 1;
  for (let o = 0; o < oct; o++) { v += a * ruido(x * f, y * f, s + o * 17); a *= 0.5; f *= 2.03; }
  return v;
}
const paso = (a, b, t) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };

/** Altura (m, relativa a la base) y si el suelo es arena suelta, en el punto (x, y) del marco local. */
export function alturaEn(x, y) {
  const u = x * CU + y * SU;                  // a lo largo del viento
  const v = -x * SU + y * CU;                 // a través
  const vw = v + 55 * fbm(x / 800, y / 800, 3);
  const celda = Math.floor(vw / SEP);
  const t = vw / SEP - celda - 0.5;           // −0.5…0.5 dentro de la franja de una cresta
  const r1 = hash(celda, 7, 11), r2 = hash(celda, 9, 13), r3 = hash(celda, 5, 19);
  const ancho = 0.2 + 0.14 * r1;
  const alto = 16 + 26 * r2;
  // Perfil transversal: cresta redondeada y flancos empinados.
  const q = Math.abs(t) / ancho;
  const transversal = q < 1 ? Math.pow(1 - q * q, 0.55) : 0;
  // Perfil a lo largo: tramos de 500–1100 m, romos contra el viento y afilados a favor, con huecos entre tramos.
  const largo = 500 + 600 * r3;
  const uu = (u + 1400 * r1) / largo;
  const s = uu - Math.floor(uu);
  const seg = Math.floor(uu);
  const vivo = hash(seg, celda, 23) > 0.18 ? 1 : 0;
  const alLargo = paso(0, 0.07, s) * Math.pow(Math.max(0, 1 - s / 0.88), 0.75) * vivo;
  let h = alto * transversal * alLargo * (0.8 + 0.4 * hash(seg, celda, 29));
  // Capas: escalones de ~3 m en las laderas.
  const capa = 3.2;
  const esc = capa * (Math.floor(h / capa) + paso(0.3, 0.7, h / capa - Math.floor(h / capa)));
  h = h * 0.45 + esc * 0.55;
  // Base regional suave y rugosidad.
  const base = 9 * fbm(x / 1100, y / 1100, 41) + 0.0025 * (x - 2000);
  const cresta = paso(1.5, 6, h);
  const rugoso = (1.4 * fbm(x / 70, y / 70, 53, 3)) * (0.3 + 0.7 * cresta);
  const rizos = (1 - cresta) * 0.35 * Math.sin((u / 22 + 0.6 * fbm(x / 300, y / 300, 61, 2)) * 2 * Math.PI);
  return { z: base + h + rugoso + rizos, suelto: cresta < 0.25 };
}

/**
 * Rejilla de alturas (filas de norte a sur, como el heightmap de la API) y estadísticas.
 * @param {number} cols @param {number} filas
 */
export function generarRejilla(cols, filas) {
  const z = new Float32Array(cols * filas);
  const suelto = new Uint8Array(cols * filas);
  let zMin = Infinity, zMax = -Infinity;
  for (let f = 0; f < filas; f++) {
    const y = EXTENT.max_y - (f / (filas - 1)) * (EXTENT.max_y - EXTENT.min_y);
    for (let c = 0; c < cols; c++) {
      const x = EXTENT.min_x + (c / (cols - 1)) * (EXTENT.max_x - EXTENT.min_x);
      const a = alturaEn(x, y);
      const i = f * cols + c;
      z[i] = a.z; suelto[i] = a.suelto ? 1 : 0;
      if (a.z < zMin) zMin = a.z;
      if (a.z > zMax) zMax = a.z;
    }
  }
  return { ancho: cols, alto: filas, z, suelto, zMin, zMax };
}
