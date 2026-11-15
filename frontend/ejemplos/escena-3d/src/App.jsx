import { Component, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Bounds, ContactShadows, Environment, Lightformer, MapControls, OrbitControls } from "@react-three/drei";
import {
  TerrenoJezero, RutaEnTerreno, PuntoDeInteres, ModeloDelEquipo, useModelosDelEquipo, perfilDelDispositivo,
  crearTransformacion, obtenerRegion, obtenerTerreno, obtenerPuntos, compararRutas, API_URL,
} from "./tepexa3d/index.js";

const REGION = "jezero-margin";
// Misión sugerida (docs/HANDOFF-FRONTEND.md, sección 3): base → 4 rocas con carbonato → regreso.
const OBJETIVOS_SUGERIDOS = ["pelican-point", "lefroy-bay", "comet-geyser", "old-faithful-geyser"];
const PERFILES = {
  shortest: { color: "#4FC3F7", es: "Más corta" },
  fastest: { color: "#FFB74D", es: "Más rápida" },
  safest: { color: "#81C784", es: "Más segura" },
};
// Calidad del terreno real. Celulares: nivel "mobile" y 1 de cada 2 píxeles (~190 mil vértices).
const CALIDADES = {
  maxima: { lod: "desktop", paso: 1, texto: "Máxima (2 m, PC potente)" },
  alta: { lod: "desktop", paso: 2, texto: "Alta (4 m)" },
  baja: { lod: "mobile", paso: 2, texto: "Baja (8 m, celular)" },
};
const esCelular = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
const parametros = new URLSearchParams(location.search);
const calidadInicial = parametros.get("calidad") ?? (esCelular ? "baja" : "alta");

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// Render gratis duerme tras 15 min sin uso y tarda ~50 s en despertar: se reintenta mostrando un aviso.
async function conReintentos(fn, alEsperar, intentos = 8) {
  for (let i = 1; ; i++) {
    try { return await fn(); } catch (e) {
      if (i >= intentos || (e.status && e.status < 500)) throw e;
      alEsperar(i);
      await espera(8000);
    }
  }
}

class LimiteDeError extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidUpdate(prev) { if (prev.llave !== this.props.llave && this.state.error) this.setState({ error: null }); }
  render() { return this.state.error ? this.props.reemplazo(this.state.error) : this.props.children; }
}

const formatoDuracion = (min) => `${Math.floor(min / 60)} h ${Math.round(min % 60)} min`;
const mb = (b) => `${(b / 1e6).toFixed(1)} MB`;

export default function App() {
  const [vista, setVista] = useState(parametros.get("vista") ?? "terreno");
  const [panelAbierto, setPanelAbierto] = useState(!esCelular);
  return (
    <div style={{ position: "relative", height: "100%" }}>
      {vista === "terreno" ? <EscenaTerreno panelAbierto={panelAbierto} /> : <GaleriaModelos panelAbierto={panelAbierto} />}
      <nav style={{
        position: "absolute", top: 12, left: 12, right: esCelular ? 12 : "auto", width: esCelular ? "auto" : 340,
        display: "flex", gap: 6, alignItems: "center", zIndex: 2,
      }}>
        {[["terreno", "Terreno real (NASA)"], ["modelos", "Modelos del equipo"]].map(([id, texto]) => (
          <button key={id} onClick={() => setVista(id)} style={{
            flex: 1, padding: "8px 10px", borderRadius: 8, border: 0, cursor: "pointer", font: "600 13px system-ui",
            background: vista === id ? "#e8d9b5" : "rgba(18,20,26,.9)", color: vista === id ? "#1b1b1b" : "#e8e8ea",
          }}>{texto}</button>
        ))}
        <button onClick={() => setPanelAbierto((a) => !a)} title="Mostrar u ocultar el panel" style={{
          padding: "8px 10px", borderRadius: 8, border: 0, cursor: "pointer", background: "rgba(18,20,26,.9)", color: "#e8e8ea",
        }}>{panelAbierto ? "▴" : "▾"}</button>
      </nav>
    </div>
  );
}

function Panel({ abierto, children }) {
  if (!abierto) return null;
  return (
    <aside style={{
      position: "absolute", top: 56, left: 12, right: esCelular ? 12 : "auto", width: esCelular ? "auto" : 340,
      maxHeight: esCelular ? "45%" : "calc(100% - 68px)", overflow: "auto", background: "rgba(18,20,26,.9)",
      borderRadius: 10, padding: "12px 14px", boxShadow: "0 4px 20px rgba(0,0,0,.4)", zIndex: 1,
    }}>{children}</aside>
  );
}

// ------------------------------------------------------------------ Terreno real + rutas de la API
function EscenaTerreno({ panelAbierto }) {
  const [datos, setDatos] = useState(null);
  const [estado, setEstado] = useState("Conectando con la API…");
  const [error, setError] = useState(null);
  const [visibles, setVisibles] = useState({ shortest: true, fastest: true, safest: true });
  const [exageracion, setExageracion] = useState(1.5);
  const [calidad, setCalidad] = useState(calidadInicial);
  const [triangulos, setTriangulos] = useState(0);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const avisar = (i) => vivo && setEstado(`Despertando la API (intento ${i})… la primera vez puede tardar ~50 s.`);
        const region = await conReintentos(() => obtenerRegion(REGION), avisar);
        const [terreno, puntos] = await Promise.all([obtenerTerreno(REGION), obtenerPuntos(REGION)]);
        const porId = Object.fromEntries(puntos.features.map((p) => [p.id, p]));
        const base = porId.base ?? puntos.features.find((p) => p.properties.category === "base");
        let objetivos = OBJETIVOS_SUGERIDOS.map((id) => porId[id]).filter(Boolean);
        if (objetivos.length === 0) objetivos = puntos.features.filter((p) => p !== base).slice(0, 3);
        if (vivo) setEstado("Calculando las 3 rutas (~2 s)…");
        const rutas = await compararRutas({
          region_id: REGION, start: base.geometry.coordinates,
          targets: objetivos.map((p) => p.geometry.coordinates), params: region.route_defaults,
        });
        if (vivo) { setDatos({ region, terreno, puntos, base, objetivos, rutas }); setEstado(null); }
      } catch (e) { if (vivo) setError(e); }
    })();
    return () => { vivo = false; };
  }, []);

  const transformacion = useMemo(() => (datos ? crearTransformacion(datos.terreno, exageracion) : null), [datos, exageracion]);
  const alListo = useCallback((n) => setTriangulos(n), []);
  const recomendada = datos?.rutas.comparison.recommended_profile;
  const paradas = datos ? new Set([datos.base.id, ...datos.objetivos.map((p) => p.id)]) : new Set();

  return (
    <>
      <Canvas camera={{ position: esCelular ? [4, 30, 40] : [6, 16, 24], fov: 42, near: 0.05, far: 400 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={["#1a1410"]} />
        <fog attach="fog" args={["#1a1410", 45, 110]} />
        <hemisphereLight args={["#ffe9d6", "#3b2418", 0.8]} />
        {/* Sol bajo del oeste: resalta el relieve sin tapar la textura */}
        <directionalLight position={[-30, 18, 8]} intensity={2.2} color="#fff3e6" />
        <MapControls makeDefault target={[0, 0, 0]} maxPolarAngle={Math.PI / 2.15} minDistance={2} maxDistance={70} enableDamping />
        {datos && <EncuadreInicial puntos={[datos.base, ...datos.objetivos]} transformacion={transformacion} />}
        {datos && (
          <LimiteDeError llave={calidad} reemplazo={(e) => null}>
            <Suspense fallback={null}>
              <TerrenoJezero key={calidad} manifiesto={datos.terreno} transformacion={transformacion}
                             lod={CALIDADES[calidad].lod} paso={CALIDADES[calidad].paso} onListo={alListo} />
            </Suspense>
            {datos.rutas.routes.filter((r) => visibles[r.profile]).map((r) => (
              <group key={r.profile}>
                <RutaEnTerreno polilinea={r.outbound.polyline} transformacion={transformacion}
                               color={PERFILES[r.profile].color} grosor={r.profile === recomendada ? 5 : 3} />
                {r.return_trip && (
                  <RutaEnTerreno polilinea={r.return_trip.polyline} transformacion={transformacion}
                                 color={PERFILES[r.profile].color} grosor={2} discontinua />
                )}
              </group>
            ))}
            {datos.puntos.features.filter((p) => paradas.has(p.id)).map((p) => (
              <PuntoDeInteres key={p.id} punto={p} transformacion={transformacion}
                              color={p.id === datos.base.id ? "#ffffff" : "#ffd54f"} />
            ))}
          </LimiteDeError>
        )}
      </Canvas>

      <Panel abierto={panelAbierto}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Cráter Jezero · Margin Unit</div>
        <div style={{ color: "#9aa0aa", fontSize: 12, marginBottom: 8 }}>Elevación real HiRISE + rutas calculadas por la API</div>
        {estado && !error && <p style={{ color: "#ffd54f" }}>{estado}</p>}
        {error && <p style={{ color: "#ef9a9a" }}>⚠ {error.message}<br /><small>API: {API_URL}</small></p>}
        {datos && (
          <>
            {(datos.terreno.is_example || datos.rutas.is_example) && (
              <div style={{ background: "#5d4037", padding: "4px 8px", borderRadius: 4, marginBottom: 8 }}>Datos de ejemplo / Example data</div>
            )}
            {datos.rutas.routes.map((r) => {
              const p = PERFILES[r.profile];
              const t = r.total ?? r.outbound.metrics;
              return (
                <label key={r.profile} style={{ display: "flex", gap: 8, alignItems: "flex-start", margin: "6px 0", cursor: "pointer" }}>
                  <input type="checkbox" checked={visibles[r.profile]}
                         onChange={(e) => setVisibles((v) => ({ ...v, [r.profile]: e.target.checked }))} />
                  <span style={{ width: 12, height: 12, borderRadius: 2, background: p.color, marginTop: 4, flex: "none" }} />
                  <span>
                    <b>{p.es}</b>{r.profile === recomendada && <span style={{ color: "#81C784" }}> · recomendada</span>}<br />
                    <small style={{ color: "#aab" }}>
                      {(t.distance_m / 1000).toFixed(1)} km · {formatoDuracion(t.est_duration_min)} · pendiente máx. {t.max_slope_deg.toFixed(0)}°
                      {!r.within_eva_limit && <span style={{ color: "#ef9a9a" }}> · supera el tiempo de EVA</span>}
                    </small>
                  </span>
                </label>
              );
            })}
            <div style={{ fontSize: 12, color: "#aab", margin: "4px 0 10px" }}>Línea continua: ida. Discontinua: regreso a la base.</div>
            <label style={{ display: "block", fontSize: 13 }}>
              Exageración vertical: <b>×{exageracion}</b>
              <input type="range" min={1} max={4} step={0.5} value={exageracion}
                     onChange={(e) => setExageracion(Number(e.target.value))} style={{ width: "100%" }} />
            </label>
            <label style={{ display: "block", fontSize: 13, marginTop: 6 }}>
              Calidad del terreno:{" "}
              <select value={calidad} onChange={(e) => { setTriangulos(0); setCalidad(e.target.value); }}>
                {Object.entries(CALIDADES).map(([id, c]) => <option key={id} value={id}>{c.texto}</option>)}
              </select>
              <small style={{ color: "#aab" }}> {triangulos ? `${(triangulos / 1e6).toFixed(2)} M triángulos` : "cargando…"}</small>
            </label>
            <p style={{ fontSize: 12, color: "#cfc", marginTop: 10 }}>{datos.rutas.comparison.reason.es}</p>
            <p style={{ fontSize: 11, color: "#ffcc80" }}>{datos.rutas.disclaimer.es}</p>
            <p style={{ fontSize: 11, color: "#889" }}>
              Elevación: {datos.terreno.texture.source.instrument} · {datos.terreno.texture.source.attribution}
            </p>
          </>
        )}
      </Panel>
    </>
  );
}

/** Apunta la cámara al centro de la misión una sola vez. En celular mira desde el este para que la ruta
 *  (que va de oeste a este) quede vertical en la pantalla. */
function EncuadreInicial({ puntos, transformacion }) {
  const { camera, controls } = useThree();
  const [hecho, setHecho] = useState(false);
  useEffect(() => {
    if (hecho || !controls) return;
    const xs = puntos.map((p) => p.geometry.coordinates[0]);
    const ys = puntos.map((p) => p.geometry.coordinates[1]);
    const zs = puntos.map((p) => p.properties.elevation_m);
    const [cx, cy, cz] = transformacion.aEscena((Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2, zs.reduce((a, b) => a + b, 0) / zs.length);
    // En PC el panel ocupa la izquierda: se mira un poco a la izquierda del centro para que la ruta quede a la derecha.
    const tx = esCelular ? cx : cx - 2;
    controls.target.set(tx, cy, cz);
    const d = esCelular ? [26, 20, 3] : [2, 17, 24];
    camera.position.set(tx + d[0], cy + d[1], cz + d[2]);
    controls.update();
    setHecho(true);
  }, [controls, camera, puntos, transformacion, hecho]);
  return null;
}

// ------------------------------------------------------------------ Modelos del equipo (manifest.json)
const NOMBRES = {
  crater: "Cráter Jezero (reconstrucción artística con el lago antiguo)",
  medusa: "Medusae Fossae (reconstrucción artística)",
  mars: "Marte",
  drone: "Dron explorador",
};

function GaleriaModelos({ panelAbierto }) {
  const { modelos, error } = useModelosDelEquipo();
  const [id, setId] = useState(parametros.get("modelo") ?? "crater");
  const [perfil, setPerfil] = useState(perfilDelDispositivo());
  const modelo = modelos?.find((m) => m.id === id) ?? modelos?.[0];
  const datos = modelo?.[perfil] ?? modelo?.pc;

  return (
    <>
      <Canvas shadows camera={{ position: [4.5, 3.6, 6], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={["#14161b"]} />
        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 8, 4]} intensity={2} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} />
        {/* Luz de estudio hecha aquí mismo (sin descargar mapas HDR de internet) */}
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2.2} position={[0, 5, -6]} scale={[10, 4, 1]} />
          <Lightformer form="rect" intensity={1.2} color="#ffd9b8" position={[-6, 2, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
          <Lightformer form="rect" intensity={0.8} color="#b8d4ff" position={[6, 2, 2]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
        </Environment>
        <OrbitControls makeDefault autoRotate autoRotateSpeed={0.6} enableDamping minDistance={2} maxDistance={20} />
        {modelo && (
          <LimiteDeError llave={`${modelo.id}-${perfil}`} reemplazo={() => <ModeloDeReemplazo />}>
            <Suspense fallback={<ModeloDeReemplazo cargando />}>
              {/* Bounds encuadra la cámara al tamaño de cada modelo (un avatar alto o un terreno plano) */}
              <Bounds fit clip observe margin={1.25}>
                <ModeloDelEquipo key={`${modelo.id}-${perfil}`} modelo={modelo} perfil={perfil} tamano={4} />
              </Bounds>
            </Suspense>
          </LimiteDeError>
        )}
        <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={10} blur={2.2} far={4} />
      </Canvas>

      <Panel abierto={panelAbierto}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Modelos del equipo</div>
        <div style={{ background: "#3e2723", color: "#ffcc80", padding: "4px 8px", borderRadius: 4, margin: "6px 0 10px", fontSize: 12 }}>
          Modelos artísticos del equipo TEPEXA: no son datos de NASA.
        </div>
        {error && <p style={{ color: "#ef9a9a" }}>⚠ {error.message}</p>}
        {!modelos && !error && <p>Cargando /models/manifest.json…</p>}
        {modelos && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {modelos.map((m) => (
                <button key={m.id} onClick={() => setId(m.id)} style={{
                  padding: "4px 8px", borderRadius: 6, border: "1px solid #444", cursor: "pointer",
                  background: m.id === modelo?.id ? "#e8d9b5" : "transparent", color: m.id === modelo?.id ? "#1b1b1b" : "#e8e8ea",
                }}>{m.id}</button>
              ))}
            </div>
            {modelo && (
              <div style={{ marginTop: 10, fontSize: 13 }}>
                <b>{NOMBRES[modelo.id] ?? modelo.id}</b>
                <div style={{ margin: "6px 0" }}>
                  Versión:{" "}
                  {["pc", "movil"].map((p) => (
                    <label key={p} style={{ marginRight: 10 }}>
                      <input type="radio" checked={perfil === p} onChange={() => setPerfil(p)} /> {p === "pc" ? "PC" : "Celular"}
                    </label>
                  ))}
                </div>
                <small style={{ color: "#aab" }}>
                  {mb(datos.bytes)} · {datos.triangles.toLocaleString("es")} triángulos · {datos.textures} texturas
                  <br />Original: {mb(modelo.source.bytes)} ({modelo.source.triangles.toLocaleString("es")} triángulos)
                </small>
                {modelo.warnings.map((w) => <div key={w} style={{ color: "#ffcc80", fontSize: 12, marginTop: 4 }}>⚠ {w}</div>)}
              </div>
            )}
          </>
        )}
      </Panel>
    </>
  );
}

/** Reemplazo simple mientras carga o si el modelo falla: la página sigue funcionando. */
function ModeloDeReemplazo({ cargando = false }) {
  return (
    <mesh>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color={cargando ? "#555" : "#8d3b2f"} wireframe />
    </mesh>
  );
}
