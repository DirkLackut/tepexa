import { EXTENT, generarRejilla } from "./terreno.js";
import { rejillaDeRutas, compararRutasIlustrativas } from "./rutas.js";

/*
 * Escenario completo de Medusae Fossae para el simulador: terreno ILUSTRATIVO, textura, paradas y las 3 rutas.
 * Las paradas se colocan buscando en el propio terreno el lugar que corresponde (fondo plano, cresta alcanzable,
 * capas a media ladera…) entre los puntos a los que se puede llegar sin pasar la pendiente máxima.
 */

const PARADAS = [
  { id: "base", cerca: [520, 1450], buscar: "llano",
    name: { es: "Base (ilustrativa)", en: "Base (illustrative)" },
    description: { es: "Punto de partida en un corredor llano entre crestas.", en: "Starting point in a flat corridor between ridges." } },
  { id: "corredor", cerca: [1350, 1050], buscar: "bajo",
    name: { es: "Corredor de viento", en: "Wind corridor" },
    description: { es: "Fondo entre yardangs con arena suelta y rizaduras perpendiculares al viento: el suelo más lento de la caminata.", en: "Floor between yardangs with loose sand and ripples across the wind: the slowest ground of the walk." } },
  { id: "capas", cerca: [2150, 1500], buscar: "ladera",
    name: { es: "Capas expuestas", en: "Exposed layers" },
    description: { es: "La Formación Medusae Fossae es un depósito de capas finas y fáciles de erosionar. Una hipótesis es que sea ceniza volcánica (Ojha y Lewis, 2018).", en: "The Medusae Fossae Formation is a deposit of thin, easily eroded layers. One hypothesis is volcanic ash (Ojha & Lewis, 2018)." } },
  { id: "cresta", cerca: [2900, 1900], buscar: "alto",
    name: { es: "Cresta del yardang", en: "Yardang crest" },
    description: { es: "Desde arriba se ve que todas las crestas apuntan igual: registran la dirección del viento que las talló.", en: "From the top, all ridges point the same way: they record the wind that carved them." } },
  { id: "frente", cerca: [3450, 1150], buscar: "llano",
    name: { es: "Frente del yardang", en: "Yardang front" },
    description: { es: "El extremo romo mira contra el viento; la cola se afila a favor del viento.", en: "The blunt end faces into the wind; the tail tapers downwind." } },
];

function alcanzables(g, desde, maxPend) {
  const vis = new Uint8Array(g.cols * g.filas), cola = [desde];
  vis[desde] = 1;
  while (cola.length) {
    const a = cola.pop(), ca = a % g.cols, fa = (a / g.cols) | 0;
    for (let df = -1; df <= 1; df++) for (let dc = -1; dc <= 1; dc++) {
      const c = ca + dc, f = fa + df;
      if ((!dc && !df) || c < 0 || f < 0 || c >= g.cols || f >= g.filas) continue;
      const b = f * g.cols + c;
      if (vis[b]) continue;
      const [xa, ya] = g.xy(a), [xb, yb] = g.xy(b);
      const pend = (Math.atan(Math.abs(g.z[b] - g.z[a]) / Math.hypot(xb - xa, yb - ya)) * 180) / Math.PI;
      if (pend <= maxPend) { vis[b] = 1; cola.push(b); }
    }
  }
  return vis;
}

function ubicar(g, p, ok, radio = 320) {
  const [cx, cy] = p.cerca;
  let mejor = -1, puntaje = Infinity, zLoc = [Infinity, -Infinity];
  const nodos = [];
  for (let n = 0; n < g.cols * g.filas; n++) {
    const [x, y] = g.xy(n);
    if (Math.hypot(x - cx, y - cy) > radio) continue;
    zLoc = [Math.min(zLoc[0], g.z[n]), Math.max(zLoc[1], g.z[n])];
    if (ok && !ok[n]) continue;
    nodos.push(n);
  }
  for (const n of nodos) {
    const [x, y] = g.xy(n), z = g.z[n], rel = (z - zLoc[0]) / Math.max(zLoc[1] - zLoc[0], 1);
    const c = n % g.cols, f = (n / g.cols) | 0;
    const vec = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dc, df]) => g.z[Math.min(g.filas - 1, Math.max(0, f + df)) * g.cols + Math.min(g.cols - 1, Math.max(0, c + dc))]);
    const rugo = Math.max(...vec.map((v) => Math.abs(v - z)));
    const lejos = Math.hypot(x - cx, y - cy) / radio;
    const s = p.buscar === "llano" ? rugo * 2 + rel * 4 + lejos
      : p.buscar === "bajo" ? rel * 6 + rugo + lejos * 0.5
      : p.buscar === "alto" ? -rel * 6 + rugo * 0.5 + lejos * 0.5
      : Math.abs(rel - 0.5) * 6 + lejos * 0.5;                 // ladera: a media altura
    if (s < puntaje) { puntaje = s; mejor = n; }
  }
  return mejor;
}

/**
 * @param {{ cols: number, filas: number, cadaRuta: number }} calidad rejilla del terreno y submuestreo para rutas (20 m)
 * @param {any} params parámetros de ruta (los mismos del planificador)
 */
export function crearEscenarioMedusae(calidad, params) {
  const rej = generarRejilla(calidad.cols, calidad.filas);
  const g = rejillaDeRutas(rej, EXTENT, calidad.cadaRuta);
  const base = ubicar(g, PARADAS[0], null);
  const ok = alcanzables(g, base, params.max_slope_deg);
  const nodos = [base, ...PARADAS.slice(1).map((p) => ubicar(g, p, ok))];
  const paradas = PARADAS.map((p, i) => {
    const [x, y] = g.xy(nodos[i]);
    return { type: "Feature", id: p.id, geometry: { type: "Point", coordinates: [x, y] },
             properties: { name: p.name, description: p.description, elevation_m: g.z[nodos[i]], is_example: true } };
  });
  const rutas = compararRutasIlustrativas(g, paradas.map((p) => p.geometry.coordinates), params);
  const manifiesto = {
    generado: true,
    extent: EXTENT,
    z_min_m: rej.zMin, z_max_m: rej.zMax,
    scene_transform: { center_x_m: 2000, center_y_m: 1500, z_ref_m: rej.zMin, units_per_meter: 0.01 },
  };
  return { rej, manifiesto, paradas, rutas };
}
