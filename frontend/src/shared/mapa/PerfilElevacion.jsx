import { useEffect, useRef, useState } from "react";

/**
 * Corte topográfico de la ruta (elevation_profile de la API), al ancho de su contenedor.
 * Marca los objetivos y, si se pasa, la posición actual.
 * @param {any} props
 */
export function PerfilElevacion({ segmento, color = "#10B981", marcas = [], posicion_m, alto = 120 }) {
  const caja = useRef(null);
  const [ancho, setAncho] = useState(320);
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setAncho(Math.max(200, e.contentRect.width)));
    ro.observe(caja.current);
    return () => ro.disconnect();
  }, []);
  const datos = segmento.elevation_profile;
  const zs = datos.map((d) => d.z_m);
  const zMin = Math.min(...zs), zMax = Math.max(...zs);
  const sMax = datos.at(-1).s_m || 1;
  const X = (s) => 30 + (s / sMax) * (ancho - 40);
  const Y = (z) => alto - 16 - ((z - zMin) / Math.max(zMax - zMin, 1)) * (alto - 32);
  const linea = datos.map((d, i) => `${i ? "L" : "M"}${X(d.s_m).toFixed(1)},${Y(d.z_m).toFixed(1)}`).join("");
  const fuente = { fontFamily: "Space Mono, monospace", fontSize: 10 };
  return (
    <div ref={caja} style={{ width: "100%" }}>
      <svg width={ancho} height={alto} style={{ display: "block" }}>
        <path d={`${linea}L${X(sMax)},${alto - 16}L${X(0)},${alto - 16}Z`} fill={color} opacity={0.12} />
        <path d={linea} fill="none" stroke={color} strokeWidth={2} />
        {marcas.map((m, i) => (
          <g key={i}><line x1={X(m.s)} x2={X(m.s)} y1={10} y2={alto - 16} stroke="#0F172A" strokeOpacity={0.25} strokeDasharray="3 3" />
            <text x={X(m.s) + 3} y={12} fill="#0F172A" style={fuente}>{m.texto}</text></g>
        ))}
        {posicion_m != null && <circle cx={X(posicion_m)} cy={Y(interpolar(datos, posicion_m))} r={4} fill="#E8521A" />}
        <text x={0} y={Y(zMax) + 4} fill="#64748B" style={fuente}>{zMax.toFixed(0)}</text>
        <text x={0} y={Y(zMin)} fill="#64748B" style={fuente}>{zMin.toFixed(0)}</text>
        <text x={X(0)} y={alto - 2} fill="#64748B" style={fuente}>0 km</text>
        <text x={X(sMax)} y={alto - 2} fill="#64748B" textAnchor="end" style={fuente}>{(sMax / 1000).toFixed(2)} km</text>
      </svg>
    </div>
  );
}

function interpolar(datos, s) {
  for (let i = 1; i < datos.length; i++) {
    if (datos[i].s_m >= s) {
      const a = datos[i - 1], b = datos[i];
      return a.z_m + (b.z_m - a.z_m) * ((s - a.s_m) / Math.max(b.s_m - a.s_m, 1e-6));
    }
  }
  return datos.at(-1).z_m;
}
