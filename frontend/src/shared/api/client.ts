import type { components } from './types'

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'https://tepexa-api.onrender.com/api/v1'

type Texto = components['schemas']['LocalizedText']

/** Error de la API: trae el mensaje en los dos idiomas (contracts/README.md). */
export class ApiError extends Error {
  status: number
  codigo?: string
  mensaje?: Texto
  detalles?: Record<string, unknown>
  constructor(status: number, cuerpo: any) {
    super(cuerpo?.error?.message?.es ?? `Error ${status}`)
    this.status = status
    this.codigo = cuerpo?.error?.code
    this.mensaje = cuerpo?.error?.message
    this.detalles = cuerpo?.error?.details
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  })
  const cuerpo = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, cuerpo)
  return cuerpo as T
}
