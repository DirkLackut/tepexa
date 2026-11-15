import type { ReactNode } from 'react'
import { useLang } from '../hooks/useLang'
import type { Fuente as TFuente, Hecho as THecho, Punto } from '../api/endpoints'

/** Una fuente con su enlace (constitución, principio 1: todo lo que se muestra cita su fuente). */
export function Fuente({ s }: { s: TFuente }) {
  return (
    <div className="fuente">
      {s.mission}{s.instrument ? ` · ${s.instrument}` : ''} — {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.attribution}</a> : s.attribution}
    </div>
  )
}

const CERTEZA = {
  confirmed: { es: 'Confirmado', en: 'Confirmed' },
  interpretation: { es: 'Interpretación', en: 'Interpretation' },
  hypothesis: { es: 'Hipótesis', en: 'Hypothesis' },
}

export function Certeza({ c }: { c: keyof typeof CERTEZA }) {
  const { t } = useLang()
  return <span className={`certeza ${c}`}>{t(CERTEZA[c])}</span>
}

export function HechoTarjeta({ h }: { h: THecho }) {
  const { t } = useLang()
  return (
    <div className="card-white">
      <Certeza c={h.certainty} />
      <p style={{ fontSize: 13, margin: '6px 0 2px', lineHeight: 1.5 }}>{t(h.text)}</p>
      {h.sources.map((s, i) => <Fuente key={i} s={s} />)}
    </div>
  )
}

export function FichaPunto({ p, accion }: { p: Punto; accion?: ReactNode }) {
  const { t } = useLang()
  const pr = p.properties
  return (
    <div className="card-white">
      <div className="label-caps">{t({ es: 'Punto seleccionado', en: 'Selected point' })}</div>
      <h3 style={{ fontSize: '1.05rem', margin: '4px 0' }}>{t(pr.name)}</h3>
      <div className="mono tenue">
        {pr.water_episode ? `${t({ es: 'Episodio de agua', en: 'Water episode' })} ${pr.water_episode} · ` : ''}
        {pr.elevation_m?.toFixed(1) ?? '—'} m · x {p.geometry.coordinates[0].toFixed(0)} · y {p.geometry.coordinates[1].toFixed(0)}
      </div>
      <p style={{ fontSize: 13, margin: '8px 0', lineHeight: 1.5 }}>{t(pr.description)}</p>
      {pr.confidence_note && <div className="aviso">{t(pr.confidence_note)}</div>}
      {pr.evidence.map((s, i) => <Fuente key={i} s={s} />)}
      {accion && <div style={{ marginTop: 10 }}>{accion}</div>}
    </div>
  )
}

/** Etiqueta de procedencia: datos reales de NASA, datos de ejemplo o modelo artístico del equipo. */
export function Procedencia({ tipo }: { tipo: 'real' | 'ejemplo' | 'artistico' }) {
  const { t } = useLang()
  const txt = {
    real: { es: 'Datos reales de NASA', en: 'Real NASA data' },
    ejemplo: { es: 'Datos de ejemplo / Example data', en: 'Example data / Datos de ejemplo' },
    artistico: { es: 'Reconstrucción artística del equipo: no es dato de NASA', en: "Team's artistic reconstruction: not NASA data" },
  }[tipo]
  return <span className={`pill chip-${tipo}`}>{t(txt)}</span>
}

/** Pantalla de espera mientras la API despierta o si falla. */
export function EstadoCarga({ estado, error }: { estado: string; error?: Error | null }) {
  const { t } = useLang()
  if (estado === 'error') return <div className="error-caja">⚠ {error?.message} — {t({ es: 'Revisa tu conexión y recarga la página.', en: 'Check your connection and reload.' })}</div>
  return (
    <div className="card-white" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div className="pulse-anim" style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--color-primary)', margin: '0 auto 12px' }} />
      <h3 style={{ fontSize: '1rem' }}>{estado === 'despertando'
        ? t({ es: 'Despertando el servidor de datos…', en: 'Waking up the data server…' })
        : t({ es: 'Conectando con la API de TEPEXA…', en: 'Connecting to the TEPEXA API…' })}</h3>
      {estado === 'despertando' && <p className="tenue" style={{ marginTop: 6 }}>{t({ es: 'Se duerme tras 15 min sin uso. La primera carga puede tardar hasta 60 s.', en: 'It sleeps after 15 min idle. The first load can take up to 60 s.' })}</p>}
    </div>
  )
}
