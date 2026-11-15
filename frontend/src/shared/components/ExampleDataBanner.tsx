interface Props {
  isExample: boolean
  lang?: 'es' | 'en'
}

export default function ExampleDataBanner({ isExample, lang = 'es' }: Props) {
  if (!isExample) return null

  return (
    <div
      className="alert alert-warning"
      role="alert"
      aria-live="polite"
      style={{ marginBottom: '1rem', borderRadius: 'var(--radius-btn)' }}
    >
      <span style={{ fontSize: '1.1rem' }}>⚠️</span>
      <div>
        <strong>
          {lang === 'es' ? 'Datos de ejemplo / Example data' : 'Example data / Datos de ejemplo'}
        </strong>
        <br />
        <span style={{ fontSize: '0.8125rem' }}>
          {lang === 'es'
            ? 'Los datos mostrados son sintéticos, no provienen de NASA.'
            : 'The displayed data is synthetic, not from NASA.'}
        </span>
      </div>
    </div>
  )
}
