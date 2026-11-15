import { useNavigate } from 'react-router-dom'
import { useLang } from '../shared/hooks/useLang'
import { formatoDuracion, useMision } from '../shared/context/MisionContext'

/** Perfil: rol, tripulante e informes guardados en este navegador. Sin datos personales. */
export default function UserProfile() {
  const { t, lang, setLang } = useLang()
  const navigate = useNavigate()
  const { rol, tripulante, guardadas } = useMision()
  return (
    <div style={{ maxWidth: 820 }}>
      <div className="modulo-titulo"><div><h1>{t({ es: 'Perfil', en: 'Profile' })}</h1></div></div>
      <div className="rejilla-2">
        <div className="card-white">
          <div className="label-caps">{t({ es: 'Rol', en: 'Role' })}</div>
          <p style={{ fontSize: 16, fontWeight: 700, margin: '6px 0' }}>{rol === 'astronauta' ? t({ es: 'Astronauta', en: 'Astronaut' }) : rol === 'estudiante' ? t({ es: 'Estudiante', en: 'Student' }) : '—'}</p>
          <button className="hud-btn" onClick={() => navigate('/role')}>{t({ es: 'Cambiar rol', en: 'Change role' })}</button>
        </div>
        <div className="card-white">
          <div className="label-caps">{t({ es: 'Tripulante asignado', en: 'Assigned crew member' })}</div>
          <p style={{ fontSize: 16, fontWeight: 700, margin: '6px 0', textTransform: 'capitalize' }}>{tripulante} + {t({ es: 'dron', en: 'drone' })}</p>
          <button className="hud-btn" onClick={() => navigate('/app/crew')}>{t({ es: 'Cambiar tripulante', en: 'Change crew member' })}</button>
        </div>
        <div className="card-white">
          <div className="label-caps">{t({ es: 'Idioma', en: 'Language' })}</div>
          <div className="fila" style={{ marginTop: 8 }}>
            <button className={`hud-btn ${lang === 'es' ? 'hud-btn-orange' : ''}`} onClick={() => setLang('es')}>Español</button>
            <button className={`hud-btn ${lang === 'en' ? 'hud-btn-orange' : ''}`} onClick={() => setLang('en')}>English</button>
          </div>
        </div>
        <div className="card-white">
          <div className="label-caps">{t({ es: 'Misiones guardadas en esta sesión', en: 'Missions saved this session' })}</div>
          {guardadas.length === 0 ? <p className="tenue" style={{ marginTop: 6 }}>{t({ es: 'Ninguna todavía. Se guardan desde «Análisis → Informe».', en: 'None yet. Save them from "Analysis → Report".' })}</p>
            : guardadas.map((m) => (
              <div key={m.id} style={{ marginTop: 8, fontSize: 13 }}>
                <b>{m.name}</b><div className="mono tenue">{m.id} · {formatoDuracion((m.route.total ?? m.route.outbound.metrics).est_duration_min)}</div>
              </div>))}
        </div>
      </div>
    </div>
  )
}
