import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Printer, Save } from 'lucide-react'
import { useLang } from '../shared/hooks/useLang'
import { COLORES, REGION, formatoDuracion, useMision } from '../shared/context/MisionContext'
import { EstadoCarga, Fuente, HechoTarjeta, Procedencia } from '../shared/components/Datos'
import { guardarMision, obtenerInforme, type Fuente as TFuente, type Informe } from '../shared/api/endpoints'

const NOMBRE: Record<string, { es: string; en: string }> = {
  shortest: { es: 'Más corta', en: 'Shortest' }, fastest: { es: 'Más rápida', en: 'Fastest' }, safest: { es: 'Más segura', en: 'Safest' },
}
type Pestana = 'rutas' | 'geologia' | 'fuentes' | 'informe'

/** Módulo 3 · Mission Analysis: compara las rutas, explica los objetivos, junta las fuentes y guarda el informe. */
export default function MissionAnalysis() {
  const { t } = useLang()
  const navigate = useNavigate()
  const m = useMision()
  const { jezero, rutas, perfil, setPerfil, objetivos, params, tripulante } = m
  const [pestana, setPestana] = useState<Pestana>('rutas')
  const [nombre, setNombre] = useState(() => `EVA Margin Unit — ${new Date().toLocaleDateString()}`)
  const [guardando, setGuardando] = useState(false)
  const [informe, setInforme] = useState<Informe | null>(null)
  const [error, setError] = useState<any>(null)
  // Si se entra sin planificar (o se recargó la página), se calcula la misión actual.
  useEffect(() => { if (jezero && !rutas && !m.calculando) m.calcular() }, [jezero]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!jezero) return <EstadoCarga estado={m.estado} error={m.error} />

  const porId = Object.fromEntries(jezero.puntos.features.map((p) => [p.id, p]))
  const paradas = objetivos.filter((id) => porId[id]).map((id) => porId[id])

  // Todas las fuentes de lo que se muestra, sin repetir.
  const fuentes: TFuente[] = []
  const ver = new Set<string>()
  const agregar = (s: TFuente) => { const k = s.url ?? s.attribution; if (!ver.has(k)) { ver.add(k); fuentes.push(s) } }
  jezero.capas.forEach((c) => agregar(c.source))
  agregar(jezero.terreno.texture.source)
  paradas.forEach((p) => p.properties.evidence.forEach(agregar))
  jezero.region.facts.forEach((h) => h.sources.forEach(agregar))

  async function guardar() {
    if (!rutas || !params) return
    setGuardando(true); setError(null)
    try {
      const base = porId['base']
      const mision = await guardarMision({
        name: nombre, selected_profile: perfil, crew: [tripulante, 'drone'],
        route_request: { region_id: REGION, start: base.geometry.coordinates, targets: paradas.map((p) => p.geometry.coordinates), params },
      })
      m.agregarGuardada(mision)
      setInforme(await obtenerInforme(mision.id))
    } catch (e) { setError(e) } finally { setGuardando(false) }
  }

  const pestanas: [Pestana, { es: string; en: string }][] = [
    ['rutas', { es: 'Rutas', en: 'Routes' }], ['geologia', { es: 'Objetivos y geología', en: 'Targets & geology' }],
    ['fuentes', { es: 'Fuentes', en: 'Sources' }], ['informe', { es: 'Informe', en: 'Report' }],
  ]

  return (
    <div>
      <div className="modulo-titulo no-imprimir">
        <div>
          <h1>Mission Analysis — {t({ es: 'Análisis de misión', en: 'Mission analysis' })}</h1>
          <p>{t({ es: 'Compara las rutas, revisa qué se visita y con qué fuentes, y guarda el informe.', en: 'Compare routes, review what is visited and its sources, and save the report.' })}</p>
        </div>
        <div className="fila envolver">{pestanas.map(([id, txt]) => (
          <button key={id} className={`hud-btn ${pestana === id ? 'hud-btn-orange' : ''}`} onClick={() => setPestana(id)}>{t(txt)}</button>
        ))}</div>
      </div>

      {!rutas && pestana !== 'geologia' && pestana !== 'fuentes' && (
        <div className="card-white no-imprimir">
          <p style={{ fontSize: 14 }}>{m.calculando ? t({ es: 'Calculando las rutas de la misión actual…', en: 'Computing the current mission routes…' }) : t({ es: 'Todavía no hay rutas calculadas.', en: 'No routes computed yet.' })}</p>
          <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={() => navigate('/app/planner')}>{t({ es: 'Ir al planificador', en: 'Go to the planner' })}</button>
        </div>
      )}

      {pestana === 'rutas' && rutas && (
        <div className="card-white" style={{ overflowX: 'auto' }}>
          <div className="tabla-desliza"><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr className="label-caps" style={{ textAlign: 'left' }}>
              <th style={{ padding: 8 }}>{t({ es: 'Ruta', en: 'Route' })}</th><th>{t({ es: 'Distancia', en: 'Distance' })}</th><th>{t({ es: 'Tiempo', en: 'Time' })}</th>
              <th>{t({ es: 'Subida', en: 'Ascent' })}</th><th>{t({ es: 'Pend. máx.', en: 'Max slope' })}</th><th>{t({ es: 'Pend. media', en: 'Mean slope' })}</th><th>{t({ es: 'Suelo suelto', en: 'Loose soil' })}</th><th>EVA</th>
            </tr></thead>
            <tbody className="mono">{rutas.routes.map((r) => { const x = r.total ?? r.outbound.metrics; return (
              <tr key={r.profile} onClick={() => setPerfil(r.profile)} style={{ cursor: 'pointer', borderTop: '1px solid var(--color-border)', background: r.profile === perfil ? '#FFF7ED' : undefined }}>
                <td style={{ padding: 8, fontFamily: 'var(--font-inter)', fontWeight: 700 }}><span className="muestra" style={{ display: 'inline-block', background: COLORES[r.profile], marginRight: 6 }} />{t(NOMBRE[r.profile])}{r.profile === rutas.comparison.recommended_profile ? ' ★' : ''}</td>
                <td>{(x.distance_m / 1000).toFixed(2)} km</td><td>{formatoDuracion(x.est_duration_min)}</td><td>{x.ascent_m.toFixed(0)} m</td>
                <td>{x.max_slope_deg.toFixed(1)}°</td><td>{x.mean_slope_deg.toFixed(1)}°</td><td>{x.soft_soil_m.toFixed(0)} m</td>
                <td style={{ color: r.within_eva_limit ? 'var(--color-success)' : 'var(--color-danger)' }}>{r.within_eva_limit ? '✓' : '✗'}</td>
              </tr>) })}</tbody>
          </table></div>
          <p className="tenue" style={{ marginTop: 10 }}>★ {t(rutas.comparison.reason)}</p>
          <div className="aviso" style={{ marginTop: 8 }}>{t({ es: 'Las 3 rutas se parecen porque todavía no está la capa de suelo suelto (inercia térmica de THEMIS). Cuando llegue, la «más segura» se separará de las otras.', en: 'The 3 routes look alike because the loose-soil layer (THEMIS thermal inertia) is not in yet. When it arrives, the "safest" route will diverge.' })}</div>
        </div>
      )}

      {pestana === 'geologia' && (
        <div className="rejilla-2">
          <div className="panel">
            <div className="label-caps">{t({ es: 'Objetivos de la misión', en: 'Mission targets' })}</div>
            {paradas.map((p, i) => (
              <div key={p.id} className="card-white">
                <b>{i + 1}. {t(p.properties.name)}</b> <span className="mono tenue">{p.properties.elevation_m?.toFixed(1) ?? '—'} m</span>
                <p style={{ fontSize: 13, margin: '6px 0', lineHeight: 1.5 }}>{t(p.properties.description)}</p>
                {p.properties.confidence_note && <div className="aviso">{t(p.properties.confidence_note)}</div>}
                {p.properties.evidence.map((s, j) => <Fuente key={j} s={s} />)}
              </div>
            ))}
          </div>
          <div className="panel">
            <div className="label-caps">{t({ es: 'Contexto de la región', en: 'Region context' })}</div>
            {jezero.region.facts.map((h, i) => <HechoTarjeta key={i} h={h} />)}
          </div>
        </div>
      )}

      {pestana === 'fuentes' && (
        <div className="card-white">
          <div className="label-caps">{t({ es: 'Fuentes usadas', en: 'Sources used' })} ({fuentes.length})</div>
          {fuentes.map((s, i) => <div key={i} style={{ padding: '8px 0', borderTop: i ? '1px solid var(--color-border)' : undefined }}><Fuente s={s} /></div>)}
        </div>
      )}

      {pestana === 'informe' && rutas && (
        <div className="panel">
          {!informe && (
            <div className="card-white no-imprimir">
              <div className="label-caps">{t({ es: 'Guardar la misión', en: 'Save the mission' })}</div>
              <p className="tenue" style={{ margin: '6px 0' }}>{t({ es: `Se guarda la ruta «${NOMBRE[perfil].es}» con el tripulante elegido y el dron.`, en: `Saves the "${NOMBRE[perfil].en}" route with the chosen crew member and the drone.` })}</p>
              <input className="input-field" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid var(--color-border)', borderRadius: 8 }} maxLength={120} />
              <button className="btn btn-primary" style={{ marginTop: 10 }} disabled={guardando} onClick={guardar}><Save size={14} /> {guardando ? t({ es: 'Guardando…', en: 'Saving…' }) : t({ es: 'Guardar y generar informe', en: 'Save and build report' })}</button>
              {error && <div className="error-caja" style={{ marginTop: 8 }}>⚠ {t(error.mensaje) || error.message}{error.detalles?.retry_after_s ? ` (${error.detalles.retry_after_s} s)` : ''}</div>}
            </div>
          )}
          {informe && (
            <div className="card-white">
              <div className="fila entre envolver no-imprimir" style={{ marginBottom: 10 }}>
                <span className="ok-caja">✓ {t({ es: 'Misión guardada', en: 'Mission saved' })} · <span className="mono">{informe.mission_id}</span></span>
                <button className="btn btn-outline" onClick={() => window.print()}><Printer size={14} /> {t({ es: 'Imprimir o guardar PDF', en: 'Print or save PDF' })}</button>
              </div>
              <div className="solo-imprimir" style={{ marginBottom: 12 }}><b>TEPEXA — Explore the Unknown</b></div>
              <h2 style={{ fontSize: '1.3rem' }}>{t(informe.title)}</h2>
              <p style={{ margin: '6px 0 12px' }}>{t(informe.summary)}</p>
              <Procedencia tipo={informe.is_example ? 'ejemplo' : 'real'} />
              <div className="rejilla-3" style={{ margin: '12px 0' }}>
                {[[{ es: 'Distancia', en: 'Distance' }, `${(informe.metrics.distance_m / 1000).toFixed(2)} km`], [{ es: 'Duración', en: 'Duration' }, formatoDuracion(informe.metrics.est_duration_min)],
                  [{ es: 'Pendiente máxima', en: 'Max slope' }, `${informe.metrics.max_slope_deg.toFixed(1)}°`], [{ es: 'Subida', en: 'Ascent' }, `${informe.metrics.ascent_m.toFixed(0)} m`],
                  [{ es: 'Bajada', en: 'Descent' }, `${informe.metrics.descent_m.toFixed(0)} m`], [{ es: 'Suelo suelto', en: 'Loose soil' }, `${informe.metrics.soft_soil_m.toFixed(0)} m`]].map(([k, v], i) => (
                  <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 10 }}>
                    <div className="label-caps">{t(k as any)}</div><div className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{v as string}</div>
                  </div>))}
              </div>
              <div className="label-caps">{t({ es: 'Objetivos visitados', en: 'Targets visited' })}</div>
              <ol style={{ margin: '6px 0 12px 20px', fontSize: 13 }}>{informe.objectives_visited.map((o, i) => <li key={i}>{t(o)}</li>)}</ol>
              <div className="label-caps">{t({ es: 'Supuestos', en: 'Assumptions' })}</div>
              <ul style={{ margin: '6px 0 12px 20px', fontSize: 13 }}>{informe.assumptions.map((o, i) => <li key={i}>{t(o)}</li>)}</ul>
              <div className="label-caps">{t({ es: 'Limitaciones', en: 'Limitations' })}</div>
              <ul style={{ margin: '6px 0 12px 20px', fontSize: 13 }}>{informe.limitations.map((o, i) => <li key={i}>{t(o)}</li>)}</ul>
              <div className="label-caps">{t({ es: 'Fuentes', en: 'Sources' })}</div>
              {informe.sources.map((s, i) => <Fuente key={i} s={s} />)}
              <div className="aviso" style={{ marginTop: 12 }}>{t(informe.disclaimer)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
