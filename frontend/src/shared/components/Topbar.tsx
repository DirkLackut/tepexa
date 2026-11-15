import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Clock } from 'lucide-react'
import { useLang } from '../hooks/useLang'
import { useHealth } from '../hooks/useHealth'

// Sol de Perseverance (aprox.): la misión aterrizó el 18-feb-2021 20:55 UTC, a las ~15:53 hora local de Jezero (sol 0).
const SOL_MS = 88775244
const INICIO_SOL0 = Date.UTC(2021, 1, 18, 20, 55) - (15 + 53 / 60) / 24 * SOL_MS
function solActual() {
  const s = (Date.now() - INICIO_SOL0) / SOL_MS
  const hora = (s % 1) * 24
  return { sol: Math.floor(s), hora: `${String(Math.floor(hora)).padStart(2, '0')}:${String(Math.floor((hora % 1) * 60)).padStart(2, '0')}` }
}

export default function Topbar() {
  const { lang, toggle, t } = useLang()
  const salud = useHealth()
  const [marte, setMarte] = useState(solActual)
  useEffect(() => { const id = setInterval(() => setMarte(solActual()), 10000); return () => clearInterval(id) }, [])

  const estado = {
    loading: { c: '#94A3B8', es: 'Conectando…', en: 'Connecting…' },
    waking: { c: '#D97706', es: 'API despertando (~50 s)', en: 'API waking up (~50 s)' },
    alive: { c: '#10B981', es: 'API en vivo · datos NASA', en: 'API live · NASA data' },
    error: { c: '#EF4444', es: 'API sin conexión', en: 'API offline' },
  }[salud]

  return (
    <header className="dash-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/app" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo-tepexa.png" alt="TEPEXA" style={{ height: 32, width: 'auto' }} />
          <span className="orbitron-title" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '0.04em' }}>TEPEXA</span>
        </Link>
        <div className="pill pill-online" title={t(estado)}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: estado.c, display: 'inline-block' }} />
          <span className="largo" style={{ fontSize: 11, fontWeight: 700 }}>{t(estado)}</span>
        </div>
      </div>

      <div className="hud-mono reloj-sol" title={t({ es: 'Sol de la misión Perseverance y hora solar local de Jezero (aproximados)', en: 'Perseverance mission sol and Jezero local solar time (approximate)' })}
           style={{ fontSize: 12, color: 'var(--color-navy)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', border: '1px solid var(--color-border)', padding: '5px 14px', borderRadius: 20 }}>
        <Clock size={13} color="var(--color-primary)" />
        <span>SOL ~{marte.sol} · Jezero {marte.hora} LMST</span>
      </div>

      <button className="btn btn-outline" onClick={toggle} style={{ padding: '6px 14px', fontSize: 12, borderRadius: 20, fontWeight: 700 }}
              title={lang === 'en' ? 'Cambiar a español' : 'Switch to English'}>
        <Globe size={13} /><span>{lang === 'en' ? 'EN' : 'ES'}</span>
      </button>
    </header>
  )
}
