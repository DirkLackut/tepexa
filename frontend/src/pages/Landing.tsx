import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Compass, Database } from 'lucide-react'
import { useLang } from '../shared/hooks/useLang'

export default function Landing() {
  const navigate = useNavigate()
  const { lang, toggle, t } = useLang()

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Top Navbar */}
      <header className="entrada-cabecera" style={{
        height: 80,
        padding: '0 3rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--color-border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/logo-tepexa.png" alt="TEPEXA Logo" style={{ height: 44, width: 'auto' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-navy)', letterSpacing: '0.04em' }}>
            TEPEXA
          </span>
        </div>

        <div className="entrada-acciones" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            className="btn btn-outline"
            onClick={toggle}
            style={{ padding: '8px 14px', fontSize: 13, borderRadius: 8 }}
          >
            {lang === 'es' ? '🇲🇽 ES' : '🇬🇧 EN'}
          </button>
          <Link to="/login" className="btn btn-outline solo-pc" style={{ padding: '10px 20px', borderRadius: 10 }}>
            {t({ es: 'Iniciar sesión', en: 'Sign in' })}
          </Link>
          <Link to="/register-step-1" className="btn btn-orange" style={{ padding: '10px 22px', borderRadius: 10 }}>
            {t({ es: 'Registrarse', en: 'Sign up' })}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="entrada-hero" style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        background: 'radial-gradient(circle at 50% 30%, rgba(232, 82, 26, 0.04) 0%, transparent 60%)'
      }}>
        <div style={{ maxWidth: 840, textAlign: 'center' }}>
          {/* Badge superior */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF7ED', border: '1px solid #FFEDD5', padding: '6px 16px', borderRadius: 20, marginBottom: '2rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.04em' }}>
              NASA SPACE APPS CHALLENGE 2026
            </span>
          </div>

          {/* Logo TEPEXA grande centrado */}
          <div style={{ margin: '0 auto 2rem', width: 220, display: 'flex', justifyContent: 'center' }}>
            <img
              src="/logo-tepexa.png"
              alt="TEPEXA"
              style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
            />
          </div>

          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            color: 'var(--color-navy)',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            marginBottom: '1.25rem'
          }}>
            Explore the Unknown
          </h1>

          <p style={{
            fontSize: '1.2rem',
            color: 'var(--color-text-muted)',
            maxWidth: 620,
            margin: '0 auto 2.5rem',
            lineHeight: 1.6
          }}>
            {t({ es: 'Explora el cráter Jezero con datos reales de NASA, planifica una caminata (EVA) entre las rocas que muestreó Perseverance y simúlala en 3D.', en: "Explore Jezero Crater with real NASA data, plan a walk (EVA) between the rocks Perseverance sampled, and simulate it in 3D." })}
          </p>

          {/* CTA Buttons */}
          <div className="entrada-botones" style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: '4rem' }}>
            <button
              onClick={() => navigate('/app')}
              className="btn btn-primary"
              style={{ padding: '16px 36px', fontSize: 16, borderRadius: 12 }}
            >
              {t({ es: 'Comenzar exploración', en: 'Start exploring' })} <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-outline"
              style={{ padding: '16px 30px', fontSize: 16, borderRadius: 12 }}
            >
              {t({ es: 'Acceso a Control', en: 'Control access' })}
            </button>
          </div>

          {/* Features cards */}
          <div className="rejilla-3" style={{ gap: 20, textAlign: 'left' }}>
            <div className="card-white" style={{ padding: '1.5rem' }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Compass size={20} />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 6 }}>
                {t({ es: 'Cartografía real de NASA', en: 'Real NASA cartography' })}
              </h4>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                {t({ es: 'Modelo de elevación HiRISE de 1 m (USGS) de la Margin Unit y los sitios de muestra de Perseverance.', en: 'HiRISE 1 m elevation model (USGS) of the Margin Unit and Perseverance sample sites.' })}
              </p>
            </div>

            <div className="card-white" style={{ padding: '1.5rem' }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Database size={20} />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 6 }}>
                {t({ es: 'Cada dato con su fuente', en: 'Every fact with its source' })}
              </h4>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                {t({ es: 'Lo que se muestra cita la misión, el instrumento y el artículo; y dice si es confirmado, interpretación o hipótesis.', en: 'Everything shown cites the mission, instrument and paper, and says whether it is confirmed, interpretation or hypothesis.' })}
              </p>
            </div>

            <div className="card-white" style={{ padding: '1.5rem' }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <ShieldCheck size={20} />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 6 }}>
                {t({ es: 'Planificación y simulación 3D', en: 'Planning and 3D simulation' })}
              </h4>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                {t({ es: 'Tres rutas (más corta, más rápida y más segura) sobre el terreno real, y la caminata en 3D con el dron.', en: 'Three routes (shortest, fastest, safest) on the real terrain, and the 3D walk with the drone.' })}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="entrada-pie" style={{
        padding: '1.5rem 3rem',
        borderTop: '1px solid var(--color-border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 12,
        color: 'var(--color-text-muted)'
      }}>
        <span>© 2026 TEPEXA — Explore the Unknown. Desarrollado para NASA Space Apps.</span>
        <span>{t({ es: 'Datos: NASA/JPL-Caltech, USGS Astrogeology, Univ. of Arizona', en: 'Data: NASA/JPL-Caltech, USGS Astrogeology, Univ. of Arizona' })}</span>
      </footer>
    </div>
  )
}
