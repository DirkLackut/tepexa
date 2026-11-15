import type { HealthStatus } from '../hooks/useHealth'

interface Props {
  status: HealthStatus
}

const labels = {
  loading: {
    es: 'Conectando con el servidor de datos...',
    en: 'Connecting to the data server...',
  },
  waking: {
    es: 'Despertando el servidor de datos...',
    en: 'Waking up the data server...',
  },
}

const sublabels = {
  loading: {
    es: 'Iniciando conexión con la API de TEPEXA',
    en: 'Starting connection to the TEPEXA API',
  },
  waking: {
    es: 'El servidor se duerme tras 15 min de inactividad.\nLa primera carga puede tomar hasta 60 s.',
    en: 'The server sleeps after 15 min of inactivity.\nFirst load may take up to 60 s.',
  },
}

export default function LoadingScreen({ status }: Props) {
  const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('tepexa_lang') === 'en') ? 'en' : 'es'
  const label = labels[status as keyof typeof labels] ?? labels.loading
  const sublabel = sublabels[status as keyof typeof sublabels] ?? sublabels.loading

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        gap: '1.5rem',
        padding: '2rem',
      }}
    >
      <img
        src="/logo-tepexa.png"
        alt="TEPEXA"
        className="animate-pulse-logo"
        style={{ width: 100, height: 100, objectFit: 'contain' }}
      />

      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-accent)' }}>
          {label[lang]}
        </h2>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
            whiteSpace: 'pre-line',
          }}
        >
          {sublabel[lang]}
        </p>
      </div>

      <div
        style={{
          width: 300,
          height: 4,
          borderRadius: 2,
          background: 'var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div className="progress-bar-fill" />
      </div>

      {status === 'waking' && (
        <span className="badge badge-warning" style={{ marginTop: '0.5rem' }}>
          ⏳ {lang === 'es' ? 'Render cold start — hasta 60 s' : 'Render cold start — up to 60 s'}
        </span>
      )}
    </div>
  )
}
