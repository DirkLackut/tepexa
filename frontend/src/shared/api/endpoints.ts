// Llamadas a la API con los tipos generados desde contracts/openapi.json (npm run tipos).
// No escriban tipos a mano: si el contrato cambia, se regeneran.
import { apiFetch } from './client'
import type { components } from './types'

type S = components['schemas']
export type Texto = S['LocalizedText']
export type Fuente = S['Source']
export type Health = S['Health']
export type RegionResumen = S['RegionSummary']
export type Region = S['RegionDetail']
export type Hecho = S['Fact']
export type Capa = S['Layer']
export type Puntos = S['PoiCollection']
export type Punto = S['PoiFeature']
export type Terreno = S['TerrainManifest']
export type ParametrosRuta = S['RouteParams']
export type PeticionRuta = S['RouteRequest']
export type RespuestaRutas = S['RouteResponse']
export type Ruta = S['Route']
export type Perfil = S['RouteProfile']
export type Mision = S['Mission']
export type Informe = S['MissionReport']

export const obtenerSalud = () => apiFetch<Health>('/health')
export const obtenerRegiones = () => apiFetch<S['RegionList']>('/regions')
export const obtenerRegion = (id: string) => apiFetch<Region>(`/regions/${id}`)
export const obtenerCapas = (id: string) => apiFetch<S['LayerList']>(`/regions/${id}/layers`)
export const obtenerPuntos = (id: string) => apiFetch<Puntos>(`/regions/${id}/pois`)
export const obtenerTerreno = (id: string) => apiFetch<Terreno>(`/regions/${id}/terrain`)
export const compararRutas = (p: PeticionRuta) =>
  apiFetch<RespuestaRutas>('/routes/compare', { method: 'POST', body: JSON.stringify(p) })
export const guardarMision = (p: S['MissionCreate']) =>
  apiFetch<Mision>('/missions', { method: 'POST', body: JSON.stringify(p) })
export const obtenerInforme = (id: string) => apiFetch<Informe>(`/missions/${id}/report`)
