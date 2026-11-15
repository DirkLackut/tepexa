import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client'

export type HealthStatus = 'loading' | 'alive' | 'waking' | 'error'

/** Estado de la API. Render gratis duerme tras 15 min: si tarda más de 3 s se muestra «despertando». */
export function useHealth(): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>('loading')
  useEffect(() => {
    let vivo = true
    const timeout = setTimeout(() => vivo && setStatus('waking'), 3000)
    const intentar = (n: number) => apiFetch('/health')
      .then(() => { if (vivo) { clearTimeout(timeout); setStatus('alive') } })
      .catch(() => { if (!vivo) return; if (n < 8) setTimeout(() => intentar(n + 1), 8000); else setStatus('error') })
    intentar(1)
    return () => { vivo = false; clearTimeout(timeout) }
  }, [])
  return status
}
