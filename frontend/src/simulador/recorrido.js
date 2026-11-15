/** Recorrido completo (ida + regreso) con el tiempo acumulado en cada vértice, a partir de los tramos (legs) de la API. */
export function armarRecorrido(ruta) {
  const pts = [], tiempo = [], dist = [], llegadas = [];
  let t0 = 0, d0 = 0;
  for (const [seg, esRegreso] of [[ruta.outbound, false], ...(ruta.return_trip ? [[ruta.return_trip, true]] : [])]) {
    const s = seg.elevation_profile.map((p) => p.s_m);
    for (const leg of seg.legs) {
      const dur = leg.metrics.est_duration_min;
      const sIni = s[leg.vertex_start], sFin = s[leg.vertex_end];
      for (let i = leg.vertex_start; i <= leg.vertex_end; i++) {
        if (pts.length && i === leg.vertex_start) continue;
        pts.push(seg.polyline[i]);
        tiempo.push(t0 + (dur * (s[i] - sIni)) / Math.max(sFin - sIni, 1e-6));
        dist.push(d0 + (s[i] - sIni));
      }
      t0 += dur; d0 += sFin - sIni;
      llegadas.push({ t: t0, indice: leg.to_index, regreso: esRegreso });
    }
  }
  return { pts, tiempo, dist, llegadas, total: t0, distancia: d0 };
}

/** Posición, rumbo, distancia y pendiente local en el minuto t de la misión. */
export function estadoEn(rec, t) {
  const { pts, tiempo, dist } = rec;
  let i = tiempo.findIndex((x) => x >= t);
  if (i <= 0) i = i === 0 ? 1 : pts.length - 1;
  const k = Math.min(1, Math.max(0, (t - tiempo[i - 1]) / Math.max(tiempo[i] - tiempo[i - 1], 1e-9)));
  const a = pts[i - 1], b = pts[i];
  const p = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const horiz = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return { p, dir: [b[0] - a[0], b[1] - a[1]], d: dist[i - 1] + (dist[i] - dist[i - 1]) * k,
           pendiente: horiz > 0 ? (Math.atan2(b[2] - a[2], horiz) * 180) / Math.PI : 0 };
}

/** Punto del recorrido a una distancia acumulada d (metros). Sirve para mirar adelante y suavizar el rumbo. */
export function puntoADistancia(rec, d) {
  const { pts, dist } = rec;
  if (d <= 0) return pts[0];
  if (d >= dist[dist.length - 1]) return pts[pts.length - 1];
  let lo = 0, hi = dist.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (dist[m] < d) lo = m; else hi = m; }
  const k = (d - dist[lo]) / Math.max(dist[hi] - dist[lo], 1e-9), a = pts[lo], b = pts[hi];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}
