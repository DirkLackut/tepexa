import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  compararRutas, obtenerCapas, obtenerPuntos, obtenerRegion, obtenerRegiones, obtenerTerreno,
  type Capa, type Mision, type ParametrosRuta, type Perfil, type Puntos, type Region, type RegionResumen,
  type RespuestaRutas, type Terreno,
} from '../api/endpoints'

// Estado compartido de la misión: lo que se planifica en 2D es lo mismo que se analiza, se simula y se guarda.
export const REGION = 'jezero-margin'
export const SUGERIDOS = ['pelican-point', 'lefroy-bay', 'comet-geyser', 'old-faithful-geyser']
export type Rol = 'estudiante' | 'astronauta'

export interface DatosJezero { region: Region; puntos: Puntos; capas: Capa[]; terreno: Terreno }

interface Valor {
  estado: 'cargando' | 'despertando' | 'listo' | 'error'
  error: Error | null
  regiones: RegionResumen[]
  jezero: DatosJezero | null
  medusae: Region | null
  objetivos: string[]
  setObjetivos: (f: (o: string[]) => string[]) => void
  params: ParametrosRuta | null
  setParam: <K extends keyof ParametrosRuta>(k: K, v: ParametrosRuta[K]) => void
  rutas: RespuestaRutas | null
  perfil: Perfil
  setPerfil: (p: Perfil) => void
  calculando: boolean
  errorRutas: Error | null
  calcular: () => Promise<RespuestaRutas | null>
  tripulante: string
  traje: boolean
  setTraje: (v: boolean) => void
  setTripulante: (id: string) => void
  rol: Rol | null
  setRol: (r: Rol) => void
  guardadas: Mision[]
  agregarGuardada: (m: Mision) => void
}

const Contexto = createContext<Valor | null>(null)
export function useMision(): Valor {
  const v = useContext(Contexto)
  if (!v) throw new Error('useMision necesita <MisionProvider>')
  return v
}

// localStorage puede fallar (modo privado, bloqueado): todo va envuelto y la app funciona igual sin él.
function leer<T>(clave: string, defecto: T): T {
  try { const v = localStorage.getItem(clave); return v ? (JSON.parse(v) as T) : defecto } catch { return defecto }
}
function guardar(clave: string, valor: unknown) { try { localStorage.setItem(clave, JSON.stringify(valor)) } catch { /* nada */ } }

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function MisionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Valor['estado']>('cargando')
  const [error, setError] = useState<Error | null>(null)
  const [regiones, setRegiones] = useState<RegionResumen[]>([])
  const [jezero, setJezero] = useState<DatosJezero | null>(null)
  const [medusae, setMedusae] = useState<Region | null>(null)
  const [objetivos, setObjetivosState] = useState<string[]>(() => leer('tepexa_objetivos', SUGERIDOS))
  const [params, setParams] = useState<ParametrosRuta | null>(null)
  const [rutas, setRutas] = useState<RespuestaRutas | null>(null)
  const [perfil, setPerfil] = useState<Perfil>('safest')
  const [calculando, setCalculando] = useState(false)
  const [errorRutas, setErrorRutas] = useState<Error | null>(null)
  const [tripulante, setTripulanteState] = useState<string>(() => leer('tepexa_tripulante', 'china'))
  const [traje, setTrajeState] = useState<boolean>(() => leer('tepexa_traje', true))
  const [rol, setRolState] = useState<Rol | null>(() => leer<Rol | null>('tepexa_rol', null))
  const [guardadas, setGuardadas] = useState<Mision[]>([])

  useEffect(() => {
    let vivo = true
    const aviso = setTimeout(() => vivo && setEstado((e) => (e === 'cargando' ? 'despertando' : e)), 3000)
    ;(async () => {
      for (let i = 1; ; i++) {
        try {
          const lista = await obtenerRegiones()
          const [region, puntos, capas, terreno, med] = await Promise.all([
            obtenerRegion(REGION), obtenerPuntos(REGION), obtenerCapas(REGION), obtenerTerreno(REGION), obtenerRegion('medusae-fossae'),
          ])
          if (!vivo) return
          setRegiones(lista.items)
          setJezero({ region, puntos, capas: capas.items, terreno })
          setMedusae(med)
          setParams((p) => p ?? ({ ...region.route_defaults } as ParametrosRuta))
          setEstado('listo')
          return
        } catch (e) {
          if (!vivo) return
          if (i >= 8) { setError(e as Error); setEstado('error'); return }
          setEstado('despertando')
          await espera(8000)
        }
      }
    })()
    return () => { vivo = false; clearTimeout(aviso) }
  }, [])

  const setObjetivos = useCallback((f: (o: string[]) => string[]) => {
    setObjetivosState((o) => { const n = f(o); guardar('tepexa_objetivos', n); return n })
    setRutas(null)
  }, [])
  const setParam = useCallback(<K extends keyof ParametrosRuta>(k: K, v: ParametrosRuta[K]) => {
    setParams((p) => (p ? { ...p, [k]: v } : p)); setRutas(null)
  }, [])
  const setTripulante = useCallback((id: string) => { setTripulanteState(id); guardar('tepexa_tripulante', id) }, [])
  const setTraje = useCallback((v: boolean) => { setTrajeState(v); guardar('tepexa_traje', v) }, [])
  const setRol = useCallback((r: Rol) => { setRolState(r); guardar('tepexa_rol', r) }, [])
  const agregarGuardada = useCallback((m: Mision) => setGuardadas((g) => [m, ...g]), [])

  const calcular = useCallback(async () => {
    if (!jezero || !params) return null
    const porId = Object.fromEntries(jezero.puntos.features.map((p) => [p.id, p]))
    const base = porId['base']
    setCalculando(true); setErrorRutas(null)
    try {
      const r = await compararRutas({
        region_id: REGION,
        start: base.geometry.coordinates,
        targets: objetivos.filter((id) => porId[id]).map((id) => porId[id].geometry.coordinates),
        params,
      })
      setRutas(r)
      setPerfil(r.comparison.recommended_profile ?? 'safest')
      return r
    } catch (e) { setErrorRutas(e as Error); return null } finally { setCalculando(false) }
  }, [jezero, params, objetivos])

  const valor = useMemo<Valor>(() => ({
    estado, error, regiones, jezero, medusae, objetivos, setObjetivos, params, setParam, rutas, perfil, setPerfil,
    calculando, errorRutas, calcular, tripulante, setTripulante, traje, setTraje, rol, setRol, guardadas, agregarGuardada,
  }), [estado, error, regiones, jezero, medusae, objetivos, setObjetivos, params, setParam, rutas, perfil,
       calculando, errorRutas, calcular, tripulante, setTripulante, traje, setTraje, rol, setRol, guardadas, agregarGuardada])

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

/** Extensión del marco local [minX, minY, maxX, maxY] en metros. */
export function extentDe(j: DatosJezero): number[] {
  const b = j.region.bounds ?? j.terreno.extent
  return [b.min_x, b.min_y, b.max_x, b.max_y]
}

export const formatoDuracion = (min: number) => `${Math.floor(min / 60)} h ${String(Math.round(min % 60)).padStart(2, '0')} min`
export const COLORES: Record<string, string> = { shortest: '#0284C7', fastest: '#D97706', safest: '#10B981' }
