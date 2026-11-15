import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, X, Play, FileCheck2, RotateCcw } from 'lucide-react'
import { useLang } from '../shared/hooks/useLang'
import { COLORES, SUGERIDOS, formatoDuracion, useMision, extentDe } from '../shared/context/MisionContext'
import { EstadoCarga, Procedencia } from '../shared/components/Datos'
import { Mapa2D } from '../shared/mapa/Mapa2D.jsx'
import { PerfilElevacion } from '../shared/mapa/PerfilElevacion.jsx'

const NOMBRE_PERFIL: Record<string, { es: string; en: string }> = {
  shortest: { es: 'Más corta', en: 'Shortest' }, fastest: { es: 'Más rápida', en: 'Fastest' }, safest: { es: 'Más segura', en: 'Safest' },
}

/** Módulo 2 · Route Planner: objetivos en orden, límites de la EVA y las 3 rutas calculadas por la API. */
export default function RoutePlanner() {
  const { t, lang } = useLang()
  const navigate = useNavigate()
  const m = useMision()
  const { jezero, objetivos, setObjetivos, params, setParam, rutas, perfil, setPerfil, calculando, errorRutas, calcular } = m
  const capas = useMemo(() => jezero?.capas.map((c) => ({ ...c, visible: c.id === 'hillshade', opacidad: 1 })) ?? [], [jezero])
  if (!jezero || !params) return <EstadoCarga estado={m.estado} error={m.error} />

  const porId = Object.fromEntries(jezero.puntos.features.map((p) => [p.id, p]))
  const extent = extentDe(jezero)
  const alternar = (id: string) => { if (id !== 'base') setObjetivos((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id])) }
  const mover = (i: number, d: number) => setObjetivos((o) => {
    const n = [...o]; const j = i + d
    if (j < 0 || j >= n.length) return o
    ;[n[i], n[j]] = [n[j], n[i]]; return n
  })
  const activa = rutas?.routes.find((r) => r.profile === perfil)
  const marcas = activa ? activa.outbound.legs.map((l) => ({ s: activa.outbound.elevation_profile[l.vertex_end].s_m, texto: String(l.to_index) })) : []

  return (
    <div>
      <div className="modulo-titulo">
        <div>
          <h1>Route Planner — {t({ es: 'Planificador de EVA', en: 'EVA planner' })}</h1>
          <p>{t({ es: 'Elige los objetivos en orden y los límites; la API calcula las 3 rutas sobre el DTM real.', en: 'Choose targets in order and the limits; the API computes the 3 routes on the real DTM.' })}</p>
        </div>
        <button className="btn btn-primary" disabled={calculando || !objetivos.length} onClick={() => calcular()}>
          {calculando ? t({ es: 'Calculando…', en: 'Computing…' }) : t({ es: 'Calcular las 3 rutas →', en: 'Compute the 3 routes →' })}
        </button>
      </div>

      <div className="rejilla-modulo izq">
        <aside className="panel">
          <div className="card-white">
            <div className="fila entre">
              <div className="label-caps">{t({ es: 'Objetivos (en orden)', en: 'Targets (in order)' })}</div>
              <button className="hud-btn" style={{ padding: '4px 8px' }} onClick={() => setObjetivos(() => SUGERIDOS)} title={t({ es: 'Misión sugerida', en: 'Suggested mission' })}><RotateCcw size={12} /> {t({ es: 'Sugerida', en: 'Suggested' })}</button>
            </div>
            <div className="objetivo mono" style={{ marginTop: 8 }}>0. {t(porId.base.properties.name)}</div>
            {objetivos.filter((id) => porId[id]).map((id, i) => (
              <div key={id} className="objetivo" style={{ marginTop: 6 }}>
                <span className="mono">{i + 1}. {t(porId[id].properties.name)}</span>
                <span className="fila">
                  <button onClick={() => mover(i, -1)} aria-label="↑"><ArrowUp size={12} /></button>
                  <button onClick={() => mover(i, 1)} aria-label="↓"><ArrowDown size={12} /></button>
                  <button onClick={() => alternar(id)} aria-label="×"><X size={12} /></button>
                </span>
              </div>
            ))}
            <p className="tenue" style={{ marginTop: 8 }}>{t({ es: 'Toca los puntos del mapa para agregarlos o quitarlos.', en: 'Tap the map points to add or remove them.' })}</p>
          </div>

          <div className="card-white">
            <div className="label-caps">{t({ es: 'Límites de seguridad', en: 'Safety limits' })}</div>
            <label style={{ display: 'block', fontSize: 13, marginTop: 10 }}>{t({ es: 'Pendiente máxima', en: 'Max slope' })}: <b className="mono">{params.max_slope_deg}°</b>
              <input type="range" min={8} max={30} step={1} value={params.max_slope_deg} onChange={(e) => setParam('max_slope_deg', Number(e.target.value))} /></label>
            <label style={{ display: 'block', fontSize: 13, marginTop: 8 }}>{t({ es: 'Límite de EVA', en: 'EVA limit' })}: <b className="mono">{formatoDuracion(params.eva_time_limit_min)}</b>
              <input type="range" min={60} max={480} step={15} value={params.eva_time_limit_min} onChange={(e) => setParam('eva_time_limit_min', Number(e.target.value))} /></label>
            <label className="fila" style={{ fontSize: 13, marginTop: 8 }}>
              <input type="checkbox" checked={params.include_return} onChange={(e) => setParam('include_return', e.target.checked)} /> {t({ es: 'Incluir regreso a la base', en: 'Include return to base' })}</label>
            <div className="aviso" style={{ marginTop: 10 }}>{t({ es: 'Valores por defecto: referencias lunares de NASA (no hay valores oficiales para Marte).', en: 'Defaults: NASA lunar references (there are no official Mars values).' })}</div>
          </div>
        </aside>

        <div className="panel">
          <div className="lienzo-mapa" style={{ height: 'min(52vh, 520px)' }}>
            <Mapa2D extent={extent} capas={capas} pois={jezero.puntos} idioma={lang} onPunto={alternar}
                    seleccionados={objetivos} rutas={rutas} perfilActivo={perfil} />
          </div>
          {errorRutas && <div className="error-caja">⚠ {t((errorRutas as any).mensaje) || errorRutas.message}</div>}
          {rutas && (
            <>
              <div className="rejilla-3">
                {rutas.routes.map((r) => {
                  const x = r.total ?? r.outbound.metrics
                  return (
                    <button key={r.profile} className="lista-ruta" aria-pressed={r.profile === perfil} onClick={() => setPerfil(r.profile)}>
                      <span className="muestra" style={{ background: COLORES[r.profile] }} />
                      <span>
                        <span className="label-caps">{r.profile === rutas.comparison.recommended_profile ? t({ es: 'Recomendada', en: 'Recommended' }) : t({ es: 'Variante', en: 'Variant' })}</span>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{t(NOMBRE_PERFIL[r.profile])}</div>
                        <div className="mono tenue">{(x.distance_m / 1000).toFixed(2)} km · {formatoDuracion(x.est_duration_min)}</div>
                        <div className="mono tenue">↑{x.ascent_m.toFixed(0)} m · {t({ es: 'máx', en: 'max' })} {x.max_slope_deg.toFixed(1)}°</div>
                        {!r.within_eva_limit && <div style={{ color: 'var(--color-danger)', fontSize: 12, fontWeight: 600 }}>{t({ es: 'Supera el límite de EVA', en: 'Exceeds the EVA limit' })}</div>}
                      </span>
                    </button>
                  )
                })}
              </div>
              {activa && (
                <div className="card-white">
                  <div className="fila entre envolver">
                    <h3 style={{ fontSize: '1rem' }}>{t(NOMBRE_PERFIL[activa.profile])} — {t({ es: 'perfil de elevación (ida)', en: 'elevation profile (outbound)' })}</h3>
                    <Procedencia tipo={rutas.is_example ? 'ejemplo' : 'real'} />
                  </div>
                  <PerfilElevacion segmento={activa.outbound} color={COLORES[activa.profile]} marcas={marcas} alto={140} />
                  <p className="tenue" style={{ marginTop: 6 }}>{t(rutas.comparison.reason)}</p>
                  {activa.warnings.filter((w) => w.code !== 'CONCEPTUAL_ONLY').map((w, i) => <div key={i} className="aviso" style={{ marginTop: 6 }}>⚠ {t(w.message)}</div>)}
                  <div className="aviso" style={{ marginTop: 6 }}>{t(rutas.disclaimer)}</div>
                  <div className="fila envolver" style={{ marginTop: 12 }}>
                    <button className="btn btn-primary" onClick={() => navigate('/app/simulator')}><Play size={14} /> {t({ es: 'Simular en 3D', en: 'Simulate in 3D' })}</button>
                    <button className="btn btn-outline" onClick={() => navigate('/app/analysis')}><FileCheck2 size={14} /> {t({ es: 'Analizar y guardar', en: 'Analyze and save' })}</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
