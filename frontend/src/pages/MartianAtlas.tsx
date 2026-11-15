import { lazy, Suspense, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Layers, MapPin, Plus, Check, X, Info } from 'lucide-react'
import { useLang } from '../shared/hooks/useLang'
import { useMision, extentDe } from '../shared/context/MisionContext'
import { EstadoCarga, FichaPunto, Fuente, HechoTarjeta, Procedencia } from '../shared/components/Datos'
import { Mapa2D } from '../shared/mapa/Mapa2D.jsx'

const VisorModelo = lazy(() => import('../shared/components/VisorModelo'))
const AtlasMedusae = lazy(() => import('./AtlasMedusae'))

// Capas que el backend todavía no tiene: se muestran desactivadas, nunca con datos inventados (principio 1).
const PROXIMAS = [
  { id: 'ortho', es: 'Ortoimagen HiRISE 25 cm', en: 'HiRISE 25 cm orthoimage' },
  { id: 'themis', es: 'Inercia térmica (THEMIS) · suelo suelto', en: 'Thermal inertia (THEMIS) · loose soil' },
  { id: 'crism', es: 'Mineralogía (CRISM)', en: 'Mineralogy (CRISM)' },
]

/** Módulo 1 · Martian Atlas: capas reales, puntos de muestra de Perseverance y hechos con su certeza. */
export default function MartianAtlas() {
  const { t, lang } = useLang()
  const navigate = useNavigate()
  const { estado, error, jezero, objetivos, setObjetivos } = useMision()
  const [capas, setCapas] = useState<any[] | null>(null)
  const [puntoId, setPuntoId] = useState('pelican-point')
  const [vista, setVista] = useState<'mapa' | 'crater'>('mapa')
  const [infoCrater, setInfoCrater] = useState(true)

  const [busqueda, setBusqueda] = useSearchParams()
  const region = busqueda.get('region') === 'medusae' ? 'medusae' : 'jezero'
  const capasEstado = useMemo(() => capas ?? jezero?.capas.map((c) => ({ ...c, visible: c.default_visible, opacidad: c.default_opacity })) ?? [], [capas, jezero])
  if (!jezero) return <EstadoCarga estado={estado} error={error} />

  const selector = (
    <div className="selector-region">
      {([['jezero', { es: 'Cráter Jezero · Margin Unit', en: 'Jezero Crater · Margin Unit' }], ['medusae', { es: 'Medusae Fossae', en: 'Medusae Fossae' }]] as const).map(([id, txt]) => (
        <button key={id} className={`btn ${region === id ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBusqueda(id === 'jezero' ? {} : { region: id })}>{t(txt)}</button>
      ))}
    </div>
  )
  if (region === 'medusae') return (
    <div>
      <div className="modulo-titulo">
        <div>
          <h1>Martian Atlas — Medusae Fossae</h1>
          <p>{t({ es: 'Ficha de la región, lo que se sabe con su certeza y el modelo del equipo.', en: 'Region card, what is known with its certainty and the team model.' })}</p>
        </div>
      </div>
      {selector}
      <Suspense fallback={<EstadoCarga estado="cargando" />}><AtlasMedusae /></Suspense>
    </div>
  )

  const extent = extentDe(jezero)
  const punto = jezero.puntos.features.find((p) => p.id === puntoId)
  const cambiar = (id: string, c: Record<string, unknown>) => setCapas(capasEstado.map((x) => (x.id === id ? { ...x, ...c } : x)))
  const leyenda = capasEstado.find((c) => c.visible && c.legend)
  const esObjetivo = objetivos.includes(puntoId)

  return (
    <div>
      <div className="modulo-titulo">
        <div>
          <h1>Martian Atlas — {t({ es: 'Cartografía 2D', en: '2D Cartography' })}</h1>
          <p>{t(jezero.region.name)} · {t(jezero.region.summary)}</p>
        </div>
        <Procedencia tipo={jezero.region.is_example ? 'ejemplo' : 'real'} />
      </div>
      {selector}

      <div className="rejilla-modulo">
        <div className="lienzo-mapa">
          <div className="botones-mapa">
            <button className={`hud-btn ${vista === 'mapa' ? 'hud-btn-orange' : ''}`} onClick={() => setVista('mapa')}><MapPin size={13} /> {t({ es: 'Mapa real (NASA)', en: 'Real map (NASA)' })}</button>
            <button className={`hud-btn ${vista === 'crater' ? 'hud-btn-orange' : ''}`} onClick={() => setVista('crater')}>{t({ es: 'Cráter completo (artístico)', en: 'Whole crater (artistic)' })}</button>
          </div>
          {vista === 'mapa' ? (
            <>
              <Mapa2D extent={extent} capas={capasEstado} pois={jezero.puntos} idioma={lang} onPunto={setPuntoId}
                      seleccionados={[puntoId]} numerar={false} />
              {leyenda && (
                <div className="leyenda-mapa">
                  <b>{t(leyenda.title)}</b> ({leyenda.legend.units})
                  <div style={{ height: 10, width: 180, margin: '4px 0', borderRadius: 2, background: `linear-gradient(90deg, ${leyenda.legend.stops.map((s: any) => s.color).join(',')})` }} />
                  <div className="fila entre mono"><span>{leyenda.legend.stops[0].value} m</span><span>{leyenda.legend.stops.at(-1).value} m</span></div>
                </div>
              )}
            </>
          ) : (
            <Suspense fallback={null}>
              <VisorModelo id="crater" fondo="#14161b" />
              {infoCrater ? (
              <div className="card-white" style={{ position: 'absolute', bottom: 12, left: 12, right: 12, maxWidth: 380, fontSize: 13, paddingRight: 36 }}>
                <button onClick={() => setInfoCrater(false)} aria-label={t({ es: 'Cerrar', en: 'Close' })} title={t({ es: 'Cerrar', en: 'Close' })}
                        style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, border: '1px solid var(--color-border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                  <X size={15} />
                </button>
                <Procedencia tipo="artistico" />
                <p style={{ marginTop: 8, lineHeight: 1.5 }}>{t({
                  es: 'Jezero mide ~45 km y hace ~3 500 millones de años tenía un lago. El mapa y el 3D reales son un recorte de 4 × 3 km de su orilla interior (la Margin Unit), donde caminan las rutas.',
                  en: 'Jezero is ~45 km wide and held a lake ~3.5 billion years ago. The real map and 3D are a 4 × 3 km cut of its inner shore (the Margin Unit), where routes are walked.' })}</p>
              </div>
              ) : (
                <button className="hud-btn" onClick={() => setInfoCrater(true)} style={{ position: 'absolute', bottom: 12, left: 12 }}
                        aria-label={t({ es: 'Ver información', en: 'Show info' })}>
                  <Info size={13} /> {t({ es: 'Info', en: 'Info' })}
                </button>
              )}
            </Suspense>
          )}
        </div>

        <aside className="panel">
          <div className="card-white">
            <div className="label-caps fila"><Layers size={13} /> {t({ es: 'Capas científicas', en: 'Scientific layers' })}</div>
            {capasEstado.map((c) => (
              <div key={c.id} style={{ marginTop: 10 }}>
                <label className="fila" style={{ fontSize: 13, fontWeight: 600 }}>
                  <input type="checkbox" checked={c.visible} onChange={(e) => cambiar(c.id, { visible: e.target.checked })} />
                  {t(c.title)} <span className="mono tenue">{c.resolution_m} m/px</span>
                </label>
                <input type="range" min={0} max={1} step={0.05} value={c.opacidad} onChange={(e) => cambiar(c.id, { opacidad: Number(e.target.value) })} />
                {c.used_in_routing && <div className="tenue">✓ {t({ es: 'se usa en el cálculo de rutas', en: 'used for route computation' })}</div>}
                <Fuente s={c.source} />
              </div>
            ))}
            {PROXIMAS.map((c) => (
              <label key={c.id} className="fila tenue" style={{ marginTop: 8, opacity: 0.6 }}>
                <input type="checkbox" disabled /> {t(c)} · {t({ es: 'próximamente', en: 'coming soon' })}
              </label>
            ))}
          </div>

          {punto && (
            <FichaPunto p={punto} accion={punto.id !== 'base' && (
              <button className="btn btn-primary" style={{ width: '100%' }}
                      onClick={() => setObjetivos((o) => (o.includes(puntoId) ? o.filter((x) => x !== puntoId) : [...o, puntoId]))}>
                {esObjetivo ? <><Check size={14} /> {t({ es: 'Está en la misión (quitar)', en: 'In the mission (remove)' })}</>
                            : <><Plus size={14} /> {t({ es: 'Agregar como objetivo de la ruta', en: 'Add as route target' })}</>}
              </button>
            )} />
          )}
          <button className="btn btn-outline" onClick={() => navigate('/app/planner')}>{t({ es: 'Ir al planificador →', en: 'Go to the planner →' })}</button>

          <div className="card-white">
            <div className="label-caps">🎯 {t({ es: 'Objetivo de la misión', en: 'Mission objective' })}</div>
            <p style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{t(jezero.region.mission_objective)}</p>
          </div>
          <div className="label-caps">{t({ es: 'Lo que se sabe', en: 'What we know' })}</div>
          {jezero.region.facts.map((h, i) => <HechoTarjeta key={i} h={h} />)}
        </aside>
      </div>
    </div>
  )
}
