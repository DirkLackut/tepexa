import { lazy, Suspense, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, UserCheck } from 'lucide-react'
import { useLang } from '../shared/hooks/useLang'
import { useMision } from '../shared/context/MisionContext'

const VisorModelo = lazy(() => import('../shared/components/VisorModelo'))
type T = { es: string; en: string }

// Avatares del equipo (Tripo, optimizados en /models). Roles ficticios de la simulación; consentimiento de las
// 6 personas confirmado (spec 006, T5). Sin datos de salud.
const TRIPULACION: { id: string; nombre: string; rol: T; descripcion: T; habilidades: T[] }[] = [
  { id: 'alejandro', nombre: 'Alejandro', rol: { es: 'Comandante de la EVA', en: 'EVA commander' },
    descripcion: { es: 'Decide en el campo, marca el ritmo de marcha y los protocolos de regreso.', en: 'Makes field decisions, sets the walking pace and the return protocols.' },
    habilidades: [{ es: 'Navegación', en: 'Navigation' }, { es: 'Evaluación de pendientes', en: 'Slope assessment' }] },
  { id: 'dirk', nombre: 'Dirk', rol: { es: 'Datos y geodesia', en: 'Data & geodesy' },
    descripcion: { es: 'Valida el modelo de elevación HiRISE y las rutas calculadas.', en: 'Validates the HiRISE elevation model and the computed routes.' },
    habilidades: [{ es: 'DTM HiRISE', en: 'HiRISE DTM' }, { es: 'Rutas', en: 'Routes' }] },
  { id: 'dylan', nombre: 'Dylan', rol: { es: 'Ingeniero de soporte vital', en: 'Life-support engineer' },
    descripcion: { es: 'Vigila el tiempo de EVA y el regreso dentro del límite.', en: 'Watches EVA time and a return within the limit.' },
    habilidades: [{ es: 'Tiempo de EVA', en: 'EVA time' }, { es: 'Traje', en: 'Suit' }] },
  { id: 'israel', nombre: 'Israel', rol: { es: 'Geólogo de campo', en: 'Field geologist' },
    descripcion: { es: 'Identifica las rocas con carbonato de la Margin Unit que muestreó Perseverance.', en: "Identifies the Margin Unit carbonate rocks that Perseverance sampled." },
    habilidades: [{ es: 'Carbonatos', en: 'Carbonates' }, { es: 'Muestreo', en: 'Sampling' }] },
  { id: 'yasid', nombre: 'Yasid', rol: { es: 'Comunicaciones', en: 'Communications' },
    descripcion: { es: 'Mantiene el enlace de radio entre la tripulación, el dron y la base.', en: 'Keeps the radio link between crew, drone and base.' },
    habilidades: [{ es: 'Radio', en: 'Radio' }, { es: 'Enlace con la base', en: 'Base link' }] },
  { id: 'china', nombre: 'China', rol: { es: 'Piloto del dron', en: 'Drone pilot' },
    descripcion: { es: 'Vuela el dron de reconocimiento que acompaña la caminata.', en: 'Flies the scout drone that escorts the walk.' },
    habilidades: [{ es: 'Pilotaje del dron', en: 'Drone piloting' }, { es: 'Reconocimiento', en: 'Scouting' }] },
]

/** Módulo 5 · Crew Selection: el avatar 3D elegido es el que camina en el simulador, siempre con el dron. */
export default function CrewSelection() {
  const { t } = useLang()
  const navigate = useNavigate()
  const { tripulante, setTripulante, traje, setTraje } = useMision()
  const [ritmo, setRitmo] = useState<'caminar' | 'reposo'>('caminar')
  const [vista, setVista] = useState(tripulante)
  const elegido = TRIPULACION.find((c) => c.id === vista) ?? TRIPULACION[0]

  return (
    <div>
      <div className="modulo-titulo">
        <div>
          <h1>Crew Selection — {t({ es: 'Tripulación', en: 'Crew' })}</h1>
          <p>{t({ es: 'Elige quién camina la ruta. El dron de reconocimiento lo acompaña siempre.', en: 'Choose who walks the route. The scout drone always escorts them.' })}</p>
        </div>
        <span className="pill pill-online"><UserCheck size={12} /> {t({ es: '6 avatares 3D + dron', en: '6 3D avatars + drone' })}</span>
      </div>
      <div className="rejilla-modulo">
        <div className="rejilla-3">
          {TRIPULACION.map((c) => (
            <button key={c.id} className={`card-white ${c.id === vista ? 'hud-card-active' : ''}`} style={{ textAlign: 'left', cursor: 'pointer', position: 'relative' }} onClick={() => setVista(c.id)}>
              {c.id === tripulante && <span style={{ position: 'absolute', top: 10, right: 10, color: 'var(--color-primary)' }}><Check size={16} /></span>}
              <h3 style={{ fontSize: '1rem' }}>{c.nombre}</h3>
              <div className="label-caps" style={{ color: 'var(--color-primary)' }}>{t(c.rol)}</div>
              <p className="tenue" style={{ marginTop: 6 }}>{t(c.descripcion)}</p>
            </button>
          ))}
        </div>
        <aside className="panel">
          <div className="card-white" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ position: 'relative', height: 360 }}>
              <Suspense fallback={null}><VisorModelo id={elegido.id} articulado traje={traje} ritmo={ritmo} /></Suspense>
              <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                <button className={`btn ${traje ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setTraje(!traje)}>
                  {t({ es: traje ? 'Con casco' : 'Sin casco', en: traje ? 'Helmet on' : 'Helmet off' })}
                </button>
                <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setRitmo(ritmo === 'caminar' ? 'reposo' : 'caminar')}>
                  {ritmo === 'caminar' ? t({ es: 'Caminando', en: 'Walking' }) : t({ es: 'En reposo', en: 'Idle' })}
                </button>
              </div>
              {traje && <span className="chip-artistico" style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 11, padding: '2px 8px', borderRadius: 12 }}>{t({ es: 'Traje ilustrativo', en: 'Illustrative suit' })}</span>}
            </div>
            <div style={{ padding: '1rem' }}>
              <h3>{elegido.nombre}</h3>
              <div className="label-caps" style={{ color: 'var(--color-primary)' }}>{t(elegido.rol)}</div>
              <p style={{ fontSize: 13, margin: '8px 0' }}>{t(elegido.descripcion)}</p>
              <div className="fila envolver">{elegido.habilidades.map((h, i) => <span key={i} className="pill" style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)' }}>{t(h)}</span>)}</div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={() => { setTripulante(elegido.id); navigate('/app/simulator') }}>
                {t({ es: `Asignar a ${elegido.nombre} y simular`, en: `Assign ${elegido.nombre} and simulate` })}
              </button>
            </div>
          </div>
          <div className="card-white" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ position: 'relative', height: 180 }}><Suspense fallback={null}><VisorModelo id="drone" /></Suspense></div>
            <div style={{ padding: '0.8rem 1rem' }}><b>{t({ es: 'Dron de reconocimiento', en: 'Scout drone' })}</b><p className="tenue">{t({ es: 'Acompaña a la tripulación en el simulador, aleteando por encima de la ruta.', en: 'Escorts the crew in the simulator, flapping above the route.' })}</p></div>
          </div>
        </aside>
      </div>
    </div>
  )
}
