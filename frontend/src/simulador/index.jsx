// Simulación 3D · módulo aislado que puede llegar a cambiar (ver LEEME.md). Se carga solo al entrar al simulador.
import { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { MapControls } from "@react-three/drei";
import { ChevronDown, ChevronUp, Info, Map as MapaIcono, Settings2, X } from "lucide-react";
import { TerrenoJezero, RutaEnTerreno, PuntoDeInteres, useModelosDelEquipo, crearTransformacion } from "../shared/3d/index.js";
import { armarRecorrido } from "./recorrido.js";
import { Caminante, ESCALA_AVATAR } from "./Caminante.jsx";
import { Dron } from "./Dron.jsx";
import { Minimapa, Retrato } from "./HUD.jsx";
import { TerrenoGenerado } from "./medusae/TerrenoGenerado.jsx";

const COLORES = { shortest: "#0284C7", fastest: "#D97706", safest: "#10B981" };
const TRIPULANTES = ["china", "alejandro", "dirk", "dylan", "israel", "yasid"];
const esCelular = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
const dur = (min) => `${Math.floor(min / 60)} h ${String(Math.round(min % 60)).padStart(2, "0")} min`;

class Silencioso extends Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() { return this.state.error ? null : this.props.children; }
}

export default function SimuladorEVA({ terreno, rejilla = null, rutas, perfil, setPerfil, paradas, tripulante, setTripulante, traje = true, setTraje = (/** @type {boolean} */ _v) => {}, limiteEva, extent, t, idioma }) {
  const { modelos } = useModelosDelEquipo();
  const [camara, setCamara] = useState("seguir");
  const [hud, setHud] = useState(null);
  const [llegada, setLlegada] = useState(null);
  const reloj = useRef({ t: 0, reproduciendo: false, velocidad: 300, estado: null });
  const pose = useRef(null);
  const ruta = rutas.routes.find((r) => r.profile === perfil) ?? rutas.routes[0];
  const rec = useMemo(() => armarRecorrido(ruta), [ruta]);
  const transformacion = useMemo(() => crearTransformacion(terreno, 1.5), [terreno]);
  const modelo = modelos?.find((m) => m.id === tripulante);
  const dron = modelos?.find((m) => m.id === "drone");

  useEffect(() => { reloj.current.t = 0; reloj.current.reproduciendo = false; setLlegada(null); }, [rec]);
  useEffect(() => {
    let anterior = 0;
    const id = setInterval(() => {
      const r = reloj.current;
      const nueva = rec.llegadas.find((l) => l.t > anterior && l.t <= r.t);
      if (nueva) setLlegada({ ...nueva, hasta: Date.now() + 4500 });
      anterior = r.t;
      setHud({ t: r.t, estado: r.estado, reproduciendo: r.reproduciendo });
    }, 125);
    return () => clearInterval(id);
  }, [rec]);
  useEffect(() => {
    if (!llegada) return;
    const id = setTimeout(() => setLlegada(null), Math.max(0, llegada.hasta - Date.now()));
    return () => clearTimeout(id);
  }, [llegada]);

  // Pantallas angostas (celular o ventana chica): HUD compacto y plegable para no tapar la escena.
  const [compacto, setCompacto] = useState(() => typeof window !== "undefined" && window.innerWidth < 760);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 759px)");
    const f = () => setCompacto(mq.matches);
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  const [telemetriaAbierta, setTelemetriaAbierta] = useState(!compacto);
  const [minimapaAbierto, setMinimapaAbierto] = useState(!compacto);
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false);
  const [avisoAbierto, setAvisoAbierto] = useState(false);
  useEffect(() => { setTelemetriaAbierta(!compacto); setMinimapaAbierto(!compacto); }, [compacto]);

  const ahora = hud?.t ?? 0;
  const proxima = rec.llegadas.find((l) => l.t > ahora);
  const proximoPunto = proxima ? paradas[proxima.indice] : null;
  const fichaPunto = llegada ? paradas[llegada.indice] : null;

  const ajustes = (
    <div className="fila envolver" style={{ gap: 8 }}>
      {[["libre", { es: "Libre", en: "Free" }], ["seguir", { es: "3.ª persona", en: "3rd person" }], ["primera", { es: "1.ª persona", en: "1st person" }]].map(([c, txt]) => (
        <button key={c} className={`hud-btn ${camara === c ? "hud-btn-orange" : ""}`} onClick={() => setCamara(c)}>{t(txt)}</button>))}
      <select value={tripulante} onChange={(e) => setTripulante(e.target.value)} aria-label={t({ es: "Tripulante", en: "Crew member" })}>
        {TRIPULANTES.filter((id) => modelos?.some((m) => m.id === id)).map((id) => <option key={id} value={id}>{id}</option>)}
      </select>
      <button className={`hud-btn ${traje ? "hud-btn-orange" : ""}`} onClick={() => setTraje(!traje)}>{t({ es: "Casco", en: "Helmet" })}</button>
      <select value={perfil} onChange={(e) => setPerfil(e.target.value)} aria-label={t({ es: "Ruta", en: "Route" })}>
        {rutas.routes.map((r) => <option key={r.profile} value={r.profile}>{t({ shortest: { es: "Más corta", en: "Shortest" }, fastest: { es: "Más rápida", en: "Fastest" }, safest: { es: "Más segura", en: "Safest" } }[r.profile])}</option>)}
      </select>
    </div>
  );

  return (
    <div className="sim-lienzo">
      <Canvas camera={{ position: [0, 14, 20], fov: 50, near: 0.02, far: 400 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={["#1a1410"]} />
        <fog attach="fog" args={["#1a1410", 30, 90]} />
        <hemisphereLight args={["#ffe9d6", "#3b2418", 0.8]} />
        <directionalLight position={[-30, 18, 8]} intensity={2.2} color="#fff3e6" />
        <ambientLight intensity={0.25} />
        <MapControls makeDefault enableDamping enabled={camara === "libre"} maxPolarAngle={Math.PI / 2.05} />
        <Suspense fallback={null}>
          {terreno.generado && rejilla
            ? <TerrenoGenerado rej={rejilla} manifiesto={terreno} transformacion={transformacion} paso={2} />
            : <TerrenoJezero manifiesto={terreno} transformacion={transformacion} lod={esCelular ? "mobile" : "desktop"} paso={2} />}
        </Suspense>
        {rutas.routes.map((r) => (
          <group key={r.profile}>
            <RutaEnTerreno polilinea={r.outbound.polyline} transformacion={transformacion} color={COLORES[r.profile]} grosor={r.profile === perfil ? 4 : 1.5} />
            {r.return_trip && r.profile === perfil && (
              <RutaEnTerreno polilinea={r.return_trip.polyline} transformacion={transformacion} color={COLORES[r.profile]} grosor={2} discontinua />
            )}
          </group>
        ))}
        {paradas.map((p) => <PuntoDeInteres key={p.id} punto={p} transformacion={transformacion} idioma={idioma}
                                            color={p.id === "base" ? "#ffffff" : "#F59E0B"} alto={0.35} fija />)}
        <Caminante rec={rec} reloj={reloj} transformacion={transformacion} modelo={modelo} camara={camara} pose={pose} traje={traje} />
        {dron && <Silencioso><Suspense fallback={null}><Dron modelo={dron} objetivo={pose} envergadura={1.7 * ESCALA_AVATAR * transformacion.u * transformacion.exageracion * 0.75} /></Suspense></Silencioso>}
      </Canvas>

      <div className="hud">
        {/* Telemetría: en pantallas angostas va plegada en una línea; se despliega con la flecha. */}
        <div className={`caja telemetria ${compacto ? "compacta" : ""}`}>
          {!compacto && telemetriaAbierta && <Retrato modelo={modelo} traje={traje} />}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="fila entre" style={{ gap: 8 }}>
              <span className="grande">T+{dur(ahora)}</span>
              <button className="hud-icono" onClick={() => setTelemetriaAbierta(!telemetriaAbierta)}
                      aria-label={t(telemetriaAbierta ? { es: "Plegar telemetría", en: "Collapse telemetry" } : { es: "Ver telemetría", en: "Show telemetry" })}>
                {telemetriaAbierta ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
            {telemetriaAbierta ? (
              <>
                <div>{t({ es: "Recorrido", en: "Walked" })}: <b>{((hud?.estado?.d ?? 0) / 1000).toFixed(2)}</b> / {(rec.distancia / 1000).toFixed(2)} km</div>
                <div>{t({ es: "Elevación", en: "Elevation" })}: <b>{hud?.estado ? hud.estado.p[2].toFixed(1) : "—"} m{terreno.generado ? t({ es: " (relativa)", en: " (relative)" }) : ""}</b> · {t({ es: "pendiente", en: "slope" })} <b>{hud?.estado ? hud.estado.pendiente.toFixed(1) : "—"}°</b></div>
                <div>{t({ es: "EVA restante", en: "EVA left" })}: <b style={{ color: limiteEva - ahora < 30 ? "#EF4444" : undefined }}>{dur(Math.max(0, limiteEva - ahora))}</b></div>
                {proximoPunto && <div>{t({ es: "Próximo", en: "Next" })}: <b>{proxima.regreso && proxima.indice === 0 ? t({ es: "regreso a la base", en: "back to base" }) : t(proximoPunto.properties.name)}</b> · {dur(proxima.t - ahora)}</div>}
              </>
            ) : (
              <div className="tenue">{((hud?.estado?.d ?? 0) / 1000).toFixed(2)}/{(rec.distancia / 1000).toFixed(2)} km · EVA {dur(Math.max(0, limiteEva - ahora))}</div>
            )}
          </div>
        </div>

        {/* Minimapa: botón propio; en pantallas angostas empieza cerrado. */}
        <button className="hud-icono hud-flotante" style={{ right: 10, top: 10 }} onClick={() => setMinimapaAbierto(!minimapaAbierto)}
                aria-label={t(minimapaAbierto ? { es: "Ocultar minimapa", en: "Hide minimap" } : { es: "Ver minimapa", en: "Show minimap" })}>
          {minimapaAbierto ? <X size={16} /> : <MapaIcono size={16} />}
        </button>
        {minimapaAbierto && (
          <div className="caja" style={compacto ? { right: 10, bottom: 116 } : { right: 10, top: 52 }}>
            <Minimapa rec={rec} extent={extent} estado={hud?.estado} paradas={paradas} pequeno={compacto} />
            <div className="tenue" style={{ marginTop: 4 }}><span style={{ color: COLORES[perfil] }}>■</span> {dur(rec.total)}</div>
          </div>
        )}

        {fichaPunto && (
          <div className="caja" style={{ left: "50%", top: compacto ? 70 : 18, transform: "translateX(-50%)", width: "min(340px, 86%)", pointerEvents: "auto", paddingRight: 34 }}>
            <button className="hud-icono" style={{ position: "absolute", top: 6, right: 6 }} onClick={() => setLlegada(null)} aria-label={t({ es: "Cerrar", en: "Close" })}><X size={14} /></button>
            <div style={{ color: "#F59E0B" }}>{t({ es: "Llegada", en: "Arrival" })} · T+{dur(llegada.t)}</div>
            <b style={{ fontFamily: "var(--font-inter)" }}>{llegada.regreso && llegada.indice === 0 ? t({ es: "Regreso a la base", en: "Back to base" }) : t(fichaPunto.properties.name)}</b>
            {!(llegada.regreso && llegada.indice === 0) && <div className="tenue" style={{ fontFamily: "var(--font-inter)" }}>{t(fichaPunto.properties.description)}</div>}
          </div>
        )}

        <div className="caja controles" style={{ left: 10, right: 10, bottom: 10 }}>
          {/* Ajustes (cámara, tripulante, casco, ruta) y aviso completo: se abren dentro de la barra, sin tapar la escena. */}
          {compacto && ajustesAbiertos && (
            <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(232,82,26,.3)" }}>
              <div className="fila entre" style={{ marginBottom: 8 }}>
                <b>{t({ es: "Ajustes", en: "Settings" })}</b>
                <button className="hud-icono" onClick={() => setAjustesAbiertos(false)} aria-label={t({ es: "Cerrar ajustes", en: "Close settings" })}><X size={14} /></button>
              </div>
              {ajustes}
            </div>
          )}
          {avisoAbierto && (
            <div className="fila entre" style={{ alignItems: "flex-start", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(232,82,26,.3)", fontFamily: "var(--font-inter)" }}>
              <span>{t(rutas.disclaimer)} {t({ es: "Tripulante y dron a escala ×15 para verlos; el traje es ilustrativo.", en: "Crew and drone scaled ×15 to be visible; the suit is illustrative." })}</span>
              <button className="hud-icono" onClick={() => setAvisoAbierto(false)} aria-label={t({ es: "Cerrar aviso", en: "Close notice" })}><X size={14} /></button>
            </div>
          )}
          <div className="fila" style={{ gap: 8, flexWrap: compacto ? "nowrap" : "wrap" }}>
            <button className="hud-btn hud-btn-orange" style={{ minWidth: 40 }} onClick={() => {
              const r = reloj.current; if (r.t >= rec.total) r.t = 0; r.reproduciendo = !r.reproduciendo; }}
              aria-label={hud?.reproduciendo ? t({ es: "Pausa", en: "Pause" }) : t({ es: "Reproducir", en: "Play" })}>
              {hud?.reproduciendo ? "❚❚" : "▶"}
            </button>
            <input type="range" min={0} max={rec.total} step={0.5} value={ahora} style={{ flex: 1, minWidth: 80 }}
                   onChange={(e) => { reloj.current.t = Number(e.target.value); }} aria-label={t({ es: "Tiempo de misión", en: "Mission time" })} />
            <select defaultValue={300} onChange={(e) => { reloj.current.velocidad = Number(e.target.value); }} aria-label={t({ es: "Velocidad", en: "Speed" })}>
              <option value={60}>×60</option><option value={300}>×300</option><option value={900}>×900</option>
            </select>
            {compacto ? (
              <button className={`hud-icono ${ajustesAbiertos ? "activo" : ""}`} onClick={() => { setAjustesAbiertos(!ajustesAbiertos); setAvisoAbierto(false); }} aria-label={t({ es: "Ajustes", en: "Settings" })}><Settings2 size={16} /></button>
            ) : ajustes}
            <button className={`hud-icono ${avisoAbierto ? "activo" : ""}`} onClick={() => { setAvisoAbierto(!avisoAbierto); setAjustesAbiertos(false); }} aria-label={t({ es: "Aviso", en: "Notice" })}><Info size={16} /></button>
          </div>
          <div className="tenue" style={{ marginTop: 4 }}>{t({ es: "Planificación conceptual y educativa; no certificada.", en: "Conceptual, educational planning; not certified." })}{terreno.generado ? t({ es: " Terreno ilustrativo.", en: " Illustrative terrain." }) : ""}</div>
        </div>
      </div>
    </div>
  );
}
