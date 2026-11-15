import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../shared/hooks/useLang'
import { useMision } from '../shared/context/MisionContext'

type Role = 'student' | 'astronaut' | null

const copy = {
  heading: { es: 'Selecciona tu misión', en: 'Select your mission' },
  step: { es: 'Paso 1 de 2', en: 'Step 1 of 2' },
  studentTitle: { es: 'Estudiante', en: 'Student' },
  studentDesc: {
    es: 'Explora la Margin Unit del cráter Jezero con datos científicos reales de NASA.',
    en: 'Explore the Margin Unit of Jezero Crater with real NASA scientific data.',
  },
  studentTag: { es: 'Explorar', en: 'Explore' },
  astronautTitle: { es: 'Astronauta', en: 'Astronaut' },
  astronautDesc: {
    es: 'Planifica y simula una caminata EVA entre sitios de muestras de Perseverance.',
    en: 'Plan and simulate an EVA walk between Perseverance sample sites.',
  },
  astronautTag: { es: 'Planificar + Simular', en: 'Plan + Simulate' },
  continue: { es: 'Continuar →', en: 'Continue →' },
  select: { es: 'Seleccionar', en: 'Select' },
}

export default function RoleSelect() {
  const navigate = useNavigate()
  const { t, lang, toggle } = useLang()
  const [selected, setSelected] = useState<Role>(null)
  const { setRol } = useMision()

  return (
    <div
      className="rol-pagina"
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      {/* Top bar */}
      <div
        className="rol-barra"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 2rem',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo-tepexa.png" alt="TEPEXA" style={{ width: 32, height: 32 }} />
          <span style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: '1.1rem' }}>
            TEPEXA
          </span>
        </div>
        <button
          className="btn-ghost"
          onClick={toggle}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
          aria-label={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
        >
          {lang === 'es' ? '🇬🇧 EN' : '🇲🇽 ES'}
        </button>
      </div>

      <div
        className="animate-fadein"
        style={{ width: '100%', maxWidth: 680, paddingTop: '2rem' }}
      >
        {/* Stepper */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="stepper">
            <div className="stepper-step active" />
            <div className="stepper-gap" />
            <div className="stepper-step" />
          </div>
          <p className="label-xs" style={{ textAlign: 'center' }}>
            {t(copy.step)}
          </p>
        </div>

        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--color-accent)',
            textAlign: 'center',
            marginBottom: '2rem',
          }}
        >
          {t(copy.heading)}
        </h2>

        {/* Role cards */}
        <div
          className="rol-tarjetas"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          {/* Student */}
          <button
            onClick={() => setSelected('student')}
            aria-pressed={selected === 'student'}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'block',
              borderRadius: 'var(--radius-card)',
              border: `2px solid ${selected === 'student' ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background:
                selected === 'student'
                  ? 'rgba(232,82,26,0.04)'
                  : 'var(--color-bg)',
              padding: '1.75rem',
              boxShadow: 'var(--color-card-shadow)',
              transition: 'all 0.2s ease',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎓</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
              }}
            >
              <strong
                style={{ fontSize: '1.1rem', color: 'var(--color-text)', display: 'block' }}
              >
                {t(copy.studentTitle)}
              </strong>
              <span className="badge badge-primary">{t(copy.studentTag)}</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {t(copy.studentDesc)}
            </p>
            {selected === 'student' && (
              <div
                style={{
                  marginTop: '1rem',
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                ✓ {t(copy.select)}
              </div>
            )}
          </button>

          {/* Astronaut */}
          <button
            onClick={() => setSelected('astronaut')}
            aria-pressed={selected === 'astronaut'}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'block',
              borderRadius: 'var(--radius-card)',
              border: `2px solid ${
                selected === 'astronaut' ? 'var(--color-accent)' : 'var(--color-border)'
              }`,
              background:
                selected === 'astronaut'
                  ? 'rgba(61,26,110,0.04)'
                  : 'var(--color-bg)',
              padding: '1.75rem',
              boxShadow: 'var(--color-card-shadow)',
              transition: 'all 0.2s ease',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🚀</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
              }}
            >
              <strong
                style={{ fontSize: '1.1rem', color: 'var(--color-text)', display: 'block' }}
              >
                {t(copy.astronautTitle)}
              </strong>
              <span className="badge badge-accent">{t(copy.astronautTag)}</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {t(copy.astronautDesc)}
            </p>
            {selected === 'astronaut' && (
              <div
                style={{
                  marginTop: '1rem',
                  color: 'var(--color-accent)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                ✓ {t(copy.select)}
              </div>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            style={{ padding: "12px 36px", fontSize: 15, borderRadius: 10, minWidth: 220 }}
            disabled={!selected}
            onClick={() => {
              // El rol decide dónde empieza: estudiante en el Atlas, astronauta en el planificador. Ambos ven todo.
              setRol(selected === 'astronaut' ? 'astronauta' : 'estudiante')
              navigate(selected === 'astronaut' ? '/app/planner' : '/app')
            }}
          >
            {t(copy.continue)}
          </button>
        </div>
      </div>
    </div>
  )
}
