import { useEffect, useRef, useState } from 'react'
import { Bot, Send } from 'lucide-react'
import { useLang } from '../shared/hooks/useLang'
import { formatoDuracion, useMision } from '../shared/context/MisionContext'
import { EstadoCarga } from '../shared/components/Datos'

type Msg = { de: 'ia' | 'yo'; texto: string }
const NOMBRE: Record<string, { es: string; en: string }> = { shortest: { es: 'más corta', en: 'shortest' }, fastest: { es: 'más rápida', en: 'fastest' }, safest: { es: 'más segura', en: 'safest' } }
const sinAcentos = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Módulo 6 · Mission Intelligence. SIN IA: cada respuesta se arma con los datos de la API (rutas, puntos, hechos
 * y fuentes). No genera texto libre ni inventa números; si no sabe, lo dice y sugiere preguntas que sí puede responder.
 */
export default function MissionIntelligence() {
  const { t, lang } = useLang()
  const m = useMision()
  const { jezero, medusae, rutas, calcular, objetivos, params } = m
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [entrada, setEntrada] = useState('')
  const fin = useRef<HTMLDivElement>(null)
  useEffect(() => { fin.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])
  useEffect(() => {
    setMsgs([{ de: 'ia', texto: t({
      es: 'Hola. Respondo con los datos reales de TEPEXA: las rutas que calcula la API, los puntos de muestra de Perseverance y los hechos con su fuente. No uso IA generativa: si algo no está en los datos, te lo digo.',
      en: "Hi. I answer with TEPEXA's real data: the routes the API computes, Perseverance's sample sites and the facts with their source. I don't use generative AI: if something isn't in the data, I'll say so." }) }])
  }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!jezero || !params) return <EstadoCarga estado={m.estado} error={m.error} />

  const j = jezero
  const L = (es: string, en: string) => (lang === 'es' ? es : en)
  const pois = jezero.puntos.features
  const SUGERENCIAS = [
    L('¿Qué ruta me conviene?', 'Which route should I take?'),
    L('¿Cuánto dura la misión?', 'How long is the mission?'),
    L('¿Qué tan empinada es?', 'How steep is it?'),
    L('¿Qué es Pelican Point?', 'What is Pelican Point?'),
    L('¿Qué se sabe de Jezero?', 'What do we know about Jezero?'),
    L('¿De dónde salen los datos?', 'Where does the data come from?'),
    L('¿Qué es Medusae Fossae?', 'What is Medusae Fossae?'),
  ]

  async function responder(q: string): Promise<string> {
    const s = sinAcentos(q)
    const punto = pois.find((p) => s.includes(sinAcentos(p.properties.name.es)) || s.includes(sinAcentos(p.id.replace(/-/g, ' '))))
    if (punto) {
      const pr = punto.properties
      return `${t(pr.name)} · ${pr.elevation_m?.toFixed(1) ?? '—'} m\n${t(pr.description)}${pr.confidence_note ? `\n${L('Nota', 'Note')}: ${t(pr.confidence_note)}` : ''}\n${L('Fuentes', 'Sources')}: ${pr.evidence.map((e) => e.attribution).join('; ') || '—'}`
    }
    if (/medusa/.test(s)) {
      return medusae ? `${t(medusae.name)}: ${t(medusae.summary)}\n${L('Está en el Atlas con sus hechos y su certeza. La API no tiene un modelo de elevación real a escala de caminata de esa zona, así que la caminata se ensaya en un terreno ilustrativo (Simulación 3D → Medusae Fossae), marcado como tal.', 'It is in the Atlas with its facts and certainty. The API has no real walking-scale elevation model of that area, so the walk is rehearsed on an illustrative terrain (3D Simulation → Medusae Fossae), labelled as such.')}` : '—'
    }
    if (/fuente|dato|nasa|source|data/.test(s)) {
      const src = j.terreno.texture.source
      return `${L('Elevación', 'Elevation')}: ${src.mission} · ${src.instrument} — ${src.attribution}\n${L('Puntos', 'Points')}: ${L('posiciones de Perseverance por sol (travesía oficial, NASA/JPL-Caltech)', "Perseverance positions by sol (official traverse, NASA/JPL-Caltech)")}\n${L('Hechos', 'Facts')}: ${[...new Set(j.region.facts.flatMap((h) => h.sources.map((x) => x.attribution)))].join('; ')}`
    }
    if (/sabe|jezero|agua|lago|water|lake|know/.test(s)) {
      return j.region.facts.map((h) => `• [${h.certainty}] ${t(h.text)}`).join('\n')
    }
    // Las preguntas de ruta necesitan rutas calculadas: se calculan con la misión actual si hace falta.
    const r = rutas ?? (await calcular())
    if (!r) return L('No pude calcular las rutas ahora. Prueba en el planificador.', "I couldn't compute the routes now. Try the planner.")
    const rec = r.routes.find((x) => x.profile === r.comparison.recommended_profile) ?? r.routes[0]
    const mt = rec.total ?? rec.outbound.metrics
    const nombres = objetivos.map((id) => pois.find((p) => p.id === id)).filter(Boolean).map((p) => t(p!.properties.name)).join(' → ')
    if (/conviene|recomiend|mejor|cual|which|best|recommend/.test(s)) {
      return `${L('Te conviene la ruta', 'Take the')} ${t(NOMBRE[rec.profile])}${L('', ' route')}: ${t(r.comparison.reason)}\n` +
        r.routes.map((x) => { const k = x.total ?? x.outbound.metrics; return `• ${t(NOMBRE[x.profile])}: ${(k.distance_m / 1000).toFixed(2)} km, ${formatoDuracion(k.est_duration_min)}, ${L('máx', 'max')} ${k.max_slope_deg.toFixed(1)}°` }).join('\n')
    }
    if (/dura|tiempo|eva|hora|long|time/.test(s)) {
      return `${L('Misión', 'Mission')}: ${L('base', 'base')} → ${nombres}${params!.include_return ? L(' → regreso', ' → return') : ''}\n${L('Ruta', 'Route')} ${t(NOMBRE[rec.profile])}: ${formatoDuracion(mt.est_duration_min)} ${L('de', 'of')} ${formatoDuracion(params!.eva_time_limit_min)} ${L('disponibles', 'available')} — ${rec.within_eva_limit ? L('cabe en el límite de EVA.', 'fits within the EVA limit.') : L('supera el límite de EVA.', 'exceeds the EVA limit.')}`
    }
    if (/pendiente|empinad|inclin|slope|steep/.test(s)) {
      return `${L('Pendiente máxima', 'Max slope')}: ${mt.max_slope_deg.toFixed(1)}° · ${L('media', 'mean')}: ${mt.mean_slope_deg.toFixed(1)}° · ${L('límite', 'limit')}: ${params!.max_slope_deg}°\n${L('Subida total', 'Total ascent')}: ${mt.ascent_m.toFixed(0)} m.`
    }
    return L('Eso no está en los datos que tengo. Puedo responder sobre:\n', "That isn't in my data. I can answer about:\n") + SUGERENCIAS.map((x) => `• ${x}`).join('\n')
  }

  async function enviar(q: string) {
    if (!q.trim()) return
    setMsgs((x) => [...x, { de: 'yo', texto: q }])
    setEntrada('')
    const r = await responder(q)
    setMsgs((x) => [...x, { de: 'ia', texto: r }])
  }

  return (
    <div>
      <div className="modulo-titulo">
        <div>
          <h1>Mission Intelligence — {t({ es: 'Asistente', en: 'Assistant' })}</h1>
          <p>{t({ es: 'Respuestas armadas con los datos reales de la API. Sin IA generativa.', en: 'Answers built from the real API data. No generative AI.' })}</p>
        </div>
        <span className="pill pill-online"><Bot size={12} /> {t({ es: 'Sin IA · datos reales', en: 'No AI · real data' })}</span>
      </div>
      <div className="rejilla-modulo">
        <div className="card-white" style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 420, maxHeight: 'calc(100vh - 260px)', overflow: 'auto' }}>
          {msgs.map((x, i) => <div key={i} className={`burbuja ${x.de}`}>{x.texto}</div>)}
          <div ref={fin} />
        </div>
        <aside className="panel">
          <div className="card-white">
            <div className="label-caps">{t({ es: 'Preguntas sugeridas', en: 'Suggested questions' })}</div>
            <div className="fila envolver" style={{ marginTop: 8 }}>{SUGERENCIAS.map((q) => <button key={q} className="hud-btn" onClick={() => enviar(q)}>{q}</button>)}</div>
          </div>
          <form className="card-white fila" onSubmit={(e) => { e.preventDefault(); enviar(entrada) }}>
            <input value={entrada} onChange={(e) => setEntrada(e.target.value)} placeholder={t({ es: 'Escribe tu pregunta…', en: 'Type your question…' })}
                   style={{ flex: 1, padding: 10, border: '1px solid var(--color-border)', borderRadius: 8 }} maxLength={200} />
            <button className="btn btn-primary" type="submit"><Send size={14} /></button>
          </form>
        </aside>
      </div>
    </div>
  )
}
