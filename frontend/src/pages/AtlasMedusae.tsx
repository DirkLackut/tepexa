import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../shared/hooks/useLang'
import { useMision } from '../shared/context/MisionContext'
import { EstadoCarga, HechoTarjeta, Procedencia } from '../shared/components/Datos'

const VisorModelo = lazy(() => import('../shared/components/VisorModelo'))

/**
 * Medusae Fossae dentro del Atlas: ficha de la región, hechos con su certeza y el modelo artístico del equipo.
 * La API no tiene mapa ni rutas reales para esta región; la caminata se ensaya en el terreno ilustrativo del simulador.
 */
// El texto de la API empieza con «Próxima misión:»; aquí la región se muestra como parte del Atlas.
const sinProxima = (s: string) => { const r = s.replace(/^(próxima misión|next mission)\s*:\s*/i, ''); return r.charAt(0).toUpperCase() + r.slice(1) }

export default function AtlasMedusae() {
  const navigate = useNavigate()
  const { t } = useLang()
  const { medusae, estado, error } = useMision()
  if (!medusae) return <EstadoCarga estado={estado} error={error} />
  return (
    <div className="rejilla-modulo">
      <div className="panel">
        <div className="card-white" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="visor-medusae" style={{ position: 'relative', height: 'min(60vh, 520px)' }}>
            <Suspense fallback={null}><VisorModelo id="medusa" fondo="#14161b" /></Suspense>
            <div style={{ position: 'absolute', left: 12, bottom: 12 }}><Procedencia tipo="artistico" /></div>
          </div>
        </div>
        <div className="card-white">
          <p className="tenue" style={{ fontSize: 13 }}>
            {t(medusae.summary)} · {medusae.center.lat_deg.toFixed(1)}° {medusae.center.lat_deg < 0 ? 'S' : 'N'}, {medusae.center.lon_east_deg.toFixed(1)}° E{medusae.center.approximate ? ` (${t({ es: 'aprox.', en: 'approx.' })})` : ''}
          </p>
          <div className="label-caps" style={{ marginTop: 10 }}>🎯 {t({ es: 'Objetivo científico', en: 'Science objective' })}</div>
          <p style={{ fontSize: 14, marginTop: 6 }}>{sinProxima(t(medusae.mission_objective))}</p>
          <div className="aviso" style={{ marginTop: 10 }}>{t({
            es: 'La API todavía no tiene un modelo de elevación real a escala de caminata para esta zona. Para ensayar la caminata hay un terreno ILUSTRATIVO de yardangs, marcado como tal.',
            en: 'The API has no real walking-scale elevation model for this area yet. To rehearse the walk there is an ILLUSTRATIVE yardang terrain, labelled as such.' })}</div>
          <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={() => navigate('/app/simulator?mapa=medusae')}>
            {t({ es: 'Simular la caminata (terreno ilustrativo)', en: 'Simulate the walk (illustrative terrain)' })}
          </button>
        </div>
      </div>
      <aside className="panel">
        <div className="label-caps">{t({ es: 'Lo que se sabe (con su certeza)', en: 'What we know (with its certainty)' })}</div>
        {medusae.facts.map((h, i) => <HechoTarjeta key={i} h={h} />)}
      </aside>
    </div>
  )
}
