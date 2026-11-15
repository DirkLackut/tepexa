import { lazy, Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLang } from '../shared/hooks/useLang'
import { useMision, extentDe } from '../shared/context/MisionContext'
import { EstadoCarga } from '../shared/components/Datos'

// El simulador es un módulo aparte que puede llegar a cambiar (src/simulador/LEEME.md); no está decidido. Esta página solo le pasa los datos.
// Se carga de forma diferida: three.js y los modelos no entran en la carga inicial de la app.
const SimuladorEVA = lazy(() => import('../simulador/index.jsx'))

/** Módulo 4 · Simulación 3D: la ruta elegida sobre el terreno real, con el tripulante y el dron. */
export default function EVASimulator() {
  const { t, lang } = useLang()
  const m = useMision()
  const { jezero, rutas, calcular, calculando, perfil, setPerfil, objetivos, tripulante, setTripulante, traje, setTraje, params } = m

  // Si se entra sin planificar, se usa la misión guardada en el planificador (por defecto, la sugerida).
  useEffect(() => { if (jezero && !rutas && !calculando) calcular() }, [jezero]) // eslint-disable-line react-hooks/exhaustive-deps

  // Mapas para simular: Jezero (DTM HiRISE real, rutas de la API) y Medusae Fossae (terreno ILUSTRATIVO generado en el navegador).
  const [busqueda, setBusqueda] = useSearchParams()
  const mapa = busqueda.get('mapa') === 'medusae' ? 'medusae' : 'jezero'
  const [medusae, setMedusae] = useState<any>(null)
  useEffect(() => {
    if (mapa !== 'medusae' || !params || medusae) return
    const id = setTimeout(async () => {
      const { crearEscenarioMedusae } = await import('../simulador/medusae/escenario.js')
      const celular = window.matchMedia('(pointer: coarse)').matches
      setMedusae(crearEscenarioMedusae(celular ? { cols: 401, filas: 301, cadaRuta: 2 } : { cols: 801, filas: 601, cadaRuta: 4 }, params))
    }, 60)
    return () => clearTimeout(id)
  }, [mapa, params]) // eslint-disable-line react-hooks/exhaustive-deps

  const selector = (
    <div className="fila envolver" style={{ gap: 8, marginBottom: 12 }}>
      {([['jezero', { es: 'Jezero · Margin Unit — DTM HiRISE real', en: 'Jezero · Margin Unit — real HiRISE DTM' }],
         ['medusae', { es: 'Medusae Fossae — terreno ilustrativo', en: 'Medusae Fossae — illustrative terrain' }]] as const).map(([id, txt]) => (
        <button key={id} className={`btn ${mapa === id ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '6px 12px', fontSize: 13 }}
                onClick={() => setBusqueda(id === 'jezero' ? {} : { mapa: id })}>{t(txt)}</button>
      ))}
      {mapa === 'medusae' && <span className="chip-ejemplo" style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12 }}>
        {t({ es: 'No es un DTM de NASA: yardangs generados con las formas descritas en los estudios', en: 'Not a NASA DTM: yardangs generated from shapes described in studies' })}</span>}
    </div>
  )

  if (!jezero || !params) return <EstadoCarga estado={m.estado} error={m.error} />
  const titulo = (
    <div className="modulo-titulo">
      <div>
        <h1>{t({ es: 'Simulación 3D', en: '3D simulation' })}</h1>
        <p>{mapa === 'jezero'
          ? t({ es: 'Terreno real HiRISE, la ruta calculada y el tripulante acompañado del dron. Telemetría solo con datos de la ruta.', en: 'Real HiRISE terrain, the computed route and the crew member with the drone. Telemetry only from route data.' })
          : t({ es: 'Campo de yardangs ilustrativo de Medusae Fossae, con las 3 rutas calculadas con el mismo modelo de caminata que la API.', en: 'Illustrative Medusae Fossae yardang field, with the 3 routes computed with the same walking model as the API.' })}</p>
      </div>
    </div>
  )
  if (mapa === 'medusae') {
    if (!medusae) return <div>{titulo}{selector}<EstadoCarga estado="cargando" /></div>
    if (!medusae.rutas) return <div>{titulo}{selector}<div className="error-caja">⚠ {t({ es: 'No hay ruta posible con esa pendiente máxima.', en: 'No route possible with that maximum slope.' })}</div></div>
    return (
      <div>
        {titulo}{selector}
        <Suspense fallback={<EstadoCarga estado="cargando" />}>
          <SimuladorEVA terreno={medusae.manifiesto} rejilla={medusae.rej} rutas={medusae.rutas} perfil={perfil} setPerfil={setPerfil} paradas={medusae.paradas}
                        tripulante={tripulante} setTripulante={setTripulante} traje={traje} setTraje={setTraje} limiteEva={params.eva_time_limit_min}
                        extent={[0, 0, 4000, 3000]} t={t} idioma={lang} />
        </Suspense>
      </div>
    )
  }
  if (!rutas) return m.errorRutas ? <div className="error-caja">⚠ {m.errorRutas.message}</div> : <EstadoCarga estado="cargando" />

  const porId = Object.fromEntries(jezero.puntos.features.map((p) => [p.id, p]))
  const paradas = ['base', ...objetivos].filter((id) => porId[id]).map((id) => porId[id])

  return (
    <div>
      {titulo}{selector}
      <Suspense fallback={<EstadoCarga estado="cargando" />}>
        <SimuladorEVA terreno={jezero.terreno} rutas={rutas} perfil={perfil} setPerfil={setPerfil} paradas={paradas}
                      tripulante={tripulante} setTripulante={setTripulante} traje={traje} setTraje={setTraje} limiteEva={params.eva_time_limit_min}
                      extent={extentDe(jezero)} t={t} idioma={lang} />
      </Suspense>
    </div>
  )
}
