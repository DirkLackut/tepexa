/*
 * Rutas sobre el terreno ILUSTRATIVO de Medusae Fossae, con el mismo modelo que la API usa en Jezero
 * (backend/app/routing: walking.py y engine.py):
 *   - velocidad de Tobler ajustada a 2 km/h en plano (NASA ConOps 2020) → «tobler-eva-v1»;
 *   - tramos con pendiente mayor que el límite: prohibidos;
 *   - más corta = distancia 3D; más rápida = minutos; más segura = minutos · (1 + penalización·arena) · (1 + (pendiente/límite)²).
 * Rejilla de 20 m con 8 vecinos y Dijkstra. Se calcula en el navegador SOLO porque este terreno no existe en la API;
 * en Jezero las rutas siempre vienen de POST /routes/compare.
 */
const FLAT = 2.0, B = 3.5, C = 0.05, A = FLAT / Math.exp(-B * C);
const velocidad = (tan) => A * Math.exp(-B * Math.abs(tan + C)); // km/h
const VECINOS = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];

class Monticulo {
  constructor() { this.k = []; this.v = []; }
  get size() { return this.k.length; }
  push(n, p) {
    const k = this.k, v = this.v; let i = k.length; k.push(n); v.push(p);
    while (i > 0) { const q = (i - 1) >> 1; if (v[q] <= p) break; k[i] = k[q]; v[i] = v[q]; i = q; }
    k[i] = n; v[i] = p;
  }
  pop() {
    const k = this.k, v = this.v, top = k[0], ln = k.pop(), lv = v.pop();
    if (k.length) {
      let i = 0; const n = k.length;
      for (;;) {
        let c = 2 * i + 1; if (c >= n) break;
        if (c + 1 < n && v[c + 1] < v[c]) c++;
        if (v[c] >= lv) break;
        k[i] = k[c]; v[i] = v[c]; i = c;
      }
      k[i] = ln; v[i] = lv;
    }
    return top;
  }
}

/** Rejilla de rutas a partir de la rejilla del terreno (filas norte→sur), tomando 1 de cada `cada` puntos. */
export function rejillaDeRutas(rej, extent, cada) {
  const cols = Math.floor((rej.ancho - 1) / cada) + 1, filas = Math.floor((rej.alto - 1) / cada) + 1;
  const z = new Float32Array(cols * filas), suelto = new Uint8Array(cols * filas);
  for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++) {
    const i = f * cada * rej.ancho + c * cada;
    z[f * cols + c] = rej.z[i]; suelto[f * cols + c] = rej.suelto[i];
  }
  const dx = (extent.max_x - extent.min_x) / (cols - 1), dy = (extent.max_y - extent.min_y) / (filas - 1);
  return {
    cols, filas, z, suelto, dx, dy,
    nodo: (x, y) => Math.round((extent.max_y - y) / dy) * cols + Math.round((x - extent.min_x) / dx),
    xy: (n) => [extent.min_x + (n % cols) * dx, extent.max_y - Math.floor(n / cols) * dy],
  };
}

function tramo(g, a, b) {
  const [xa, ya] = g.xy(a), [xb, yb] = g.xy(b);
  const h = Math.hypot(xb - xa, yb - ya), dz = g.z[b] - g.z[a];
  const tan = h > 0 ? dz / h : 0;
  const d3 = Math.hypot(h, dz);
  return { d3, dz, pend: (Math.atan(Math.abs(tan)) * 180) / Math.PI, min: (d3 / 1000 / velocidad(tan)) * 60, arena: (g.suelto[a] + g.suelto[b]) / 2 };
}

function dijkstra(g, desde, hasta, perfil, p) {
  const n = g.cols * g.filas, dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1);
  const h = new Monticulo(); dist[desde] = 0; h.push(desde, 0);
  while (h.size) {
    const a = h.pop();
    if (a === hasta) break;
    const ca = a % g.cols, fa = (a / g.cols) | 0;
    for (const [dc, df] of VECINOS) {
      const c = ca + dc, f = fa + df;
      if (c < 0 || f < 0 || c >= g.cols || f >= g.filas) continue;
      const b = f * g.cols + c, e = tramo(g, a, b);
      if (e.pend > p.max_slope_deg + 1e-9) continue;
      const w = perfil === "shortest" ? e.d3 : perfil === "fastest" ? e.min
        : e.min * (1 + p.soft_soil_penalty * e.arena) * (1 + (e.pend / p.max_slope_deg) ** 2);
      const nd = dist[a] + w;
      if (nd < dist[b]) { dist[b] = nd; prev[b] = a; h.push(b, nd); }
    }
  }
  if (!isFinite(dist[hasta])) return null;
  const camino = [];
  for (let k = hasta; k !== -1; k = prev[k]) camino.push(k);
  return camino.reverse();
}

function metricas(g, nodos) {
  let d = 0, sub = 0, baj = 0, min = 0, pmax = 0, pm = 0, arena = 0;
  for (let i = 1; i < nodos.length; i++) {
    const e = tramo(g, nodos[i - 1], nodos[i]);
    d += e.d3; min += e.min; pmax = Math.max(pmax, e.pend); pm += e.pend * e.d3; arena += e.arena * e.d3;
    if (e.dz > 0) sub += e.dz; else baj -= e.dz;
  }
  return { distance_m: d, ascent_m: sub, descent_m: baj, max_slope_deg: pmax, mean_slope_deg: d ? pm / d : 0,
           est_duration_min: min, soft_soil_fraction: d ? arena / d : 0 };
}

function segmento(g, tramos, ids) {
  const nodos = [], legs = [];
  tramos.forEach((t, k) => {
    const ini = nodos.length ? nodos.length - 1 : 0;
    nodos.push(...(nodos.length ? t.slice(1) : t));
    legs.push({ from_index: ids[k][0], to_index: ids[k][1], vertex_start: ini, vertex_end: nodos.length - 1, metrics: metricas(g, t) });
  });
  let s = 0;
  const polyline = [], elevation_profile = [];
  nodos.forEach((n, i) => {
    const [x, y] = g.xy(n);
    if (i) { const [px, py] = g.xy(nodos[i - 1]); s += Math.hypot(x - px, y - py); }
    polyline.push([x, y, g.z[n]]);
    elevation_profile.push({ s_m: s, z_m: g.z[n] });
  });
  return { polyline, legs, elevation_profile, metrics: metricas(g, nodos) };
}

const suma = (a, b) => b ? { distance_m: a.distance_m + b.distance_m, ascent_m: a.ascent_m + b.ascent_m, descent_m: a.descent_m + b.descent_m,
  max_slope_deg: Math.max(a.max_slope_deg, b.max_slope_deg), mean_slope_deg: (a.mean_slope_deg * a.distance_m + b.mean_slope_deg * b.distance_m) / (a.distance_m + b.distance_m),
  est_duration_min: a.est_duration_min + b.est_duration_min, soft_soil_fraction: (a.soft_soil_fraction * a.distance_m + b.soft_soil_fraction * b.distance_m) / (a.distance_m + b.distance_m) } : a;

/**
 * Las 3 rutas (misma forma que la respuesta de POST /routes/compare, con is_example: true).
 * @param {any} g rejilla de rutas @param {[number, number][]} paradas base y objetivos en orden (x, y) @param {any} p parámetros
 */
export function compararRutasIlustrativas(g, paradas, p) {
  const nodos = paradas.map(([x, y]) => g.nodo(x, y));
  const routes = [];
  for (const perfil of ["shortest", "fastest", "safest"]) {
    const ida = [], idsIda = [];
    for (let k = 1; k < nodos.length; k++) {
      const c = dijkstra(g, nodos[k - 1], nodos[k], perfil, p);
      if (!c) return null;
      ida.push(c); idsIda.push([k - 1, k]);
    }
    const outbound = segmento(g, ida, idsIda);
    let return_trip = null;
    if (p.include_return) {
      const c = dijkstra(g, nodos[nodos.length - 1], nodos[0], perfil, p);
      if (c) return_trip = segmento(g, [c], [[nodos.length - 1, 0]]);
    }
    const total = suma(outbound.metrics, return_trip?.metrics);
    routes.push({ profile: perfil, outbound, return_trip, total, within_eva_limit: total.est_duration_min <= p.eva_time_limit_min, warnings: [] });
  }
  return {
    routes,
    is_example: true,
    disclaimer: {
      es: "Terreno y rutas ILUSTRATIVOS de Medusae Fossae: no son datos de NASA. Planificación conceptual y educativa.",
      en: "ILLUSTRATIVE Medusae Fossae terrain and routes: not NASA data. Conceptual, educational planning.",
    },
  };
}
