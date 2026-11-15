import { useEffect, useRef } from "react";
import Map from "ol/Map.js";
import View from "ol/View.js";
import ImageLayer from "ol/layer/Image.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import Static from "ol/source/ImageStatic.js";
import Projection from "ol/proj/Projection.js";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import LineString from "ol/geom/LineString.js";
import { Circle, Fill, Stroke, Style, Text } from "ol/style.js";
import ScaleLine from "ol/control/ScaleLine.js";
import { defaults as controlesBase } from "ol/control/defaults.js";
import "ol/ol.css";

// Marco local de la región en metros (no lat/lon): x al este, y al norte, origen en la esquina suroeste.
const COLORES = { shortest: "#0284C7", fastest: "#D97706", safest: "#10B981" };

function estiloPunto(f, idioma, seleccionados, numerar) {
  const id = f.getId();
  const orden = seleccionados?.indexOf(id) ?? -1;
  const esBase = f.get("category") === "base";
  const elegido = orden >= 0;
  return new Style({
    image: new Circle({
      radius: esBase ? 8 : 7,
      fill: new Fill({ color: esBase ? "#FFFFFF" : elegido ? "#E8521A" : "rgba(255,255,255,.75)" }),
      stroke: new Stroke({ color: esBase ? "#0F172A" : elegido ? "#FFFFFF" : "#E8521A", width: 2 }),
    }),
    text: new Text({
      text: (elegido && numerar ? `${orden + 1}. ` : "") + f.get("name")[idioma], offsetY: -16,
      font: "700 12px Inter, sans-serif", fill: new Fill({ color: "#0F172A" }),
      stroke: new Stroke({ color: "rgba(255,255,255,.95)", width: 4 }),
    }),
  });
}

/**
 * Mapa 2D de la región con OpenLayers.
 *  capas: items de /layers con {visible, opacidad}; pois: GeoJSON de /pois; rutas: respuesta de /routes/compare.
 */
/** @param {any} props */
export function Mapa2D({ extent, capas = [], pois, rutas, perfilActivo, seleccionados, numerar = true, idioma, onPunto, posicion }) {
  const div = useRef(null);
  const mapa = useRef(null);
  const refs = useRef({});

  useEffect(() => {
    const proyeccion = new Projection({ code: "tepexa-local", units: "m", extent });
    const fuentePuntos = new VectorSource();
    const fuenteRutas = new VectorSource();
    const fuentePos = new VectorSource();
    const capaPuntos = new VectorLayer({ source: fuentePuntos, zIndex: 20 });
    const capaRutas = new VectorLayer({ source: fuenteRutas, zIndex: 10 });
    const capaPos = new VectorLayer({ source: fuentePos, zIndex: 30, style: new Style({
      image: new Circle({ radius: 7, fill: new Fill({ color: "#E8521A" }), stroke: new Stroke({ color: "#FFFFFF", width: 3 }) }) }) });
    const m = new Map({
      target: div.current, layers: [capaRutas, capaPuntos, capaPos],
      controls: controlesBase({ attribution: false, rotate: false }).extend([new ScaleLine({ units: "metric" })]),
      view: new View({ projection: proyeccion, extent, constrainOnlyCenter: true, showFullExtent: true }),
    });
    m.getView().fit(extent, { padding: [20, 20, 20, 20] });
    m.on("singleclick", (e) => {
      const f = m.forEachFeatureAtPixel(e.pixel, (x) => (x.get("tipo") === "punto" ? x : null), { hitTolerance: 6 });
      if (f) refs.current.onPunto?.(f.getId());
    });
    m.on("pointermove", (e) => {
      const hay = m.hasFeatureAtPixel(e.pixel, { hitTolerance: 6, layerFilter: (l) => l === capaPuntos });
      div.current.style.cursor = hay ? "pointer" : "";
    });
    mapa.current = m;
    Object.assign(refs.current, { proyeccion, fuentePuntos, fuenteRutas, fuentePos, capaPuntos, imagenes: {} });
    const ro = new ResizeObserver(() => m.updateSize());
    ro.observe(div.current);
    return () => { ro.disconnect(); m.setTarget(null); };
  }, [extent.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps -- solo se recrea si cambia la extensión

  refs.current.onPunto = onPunto;

  // Capas raster (relieve, elevación…) tal como las describe /layers.
  useEffect(() => {
    const { imagenes, proyeccion } = refs.current;
    for (const c of capas) {
      if (!imagenes[c.id]) {
        const e = c.tiles.extent;
        imagenes[c.id] = new ImageLayer({ zIndex: c.z_order, source: new Static({
          url: c.tiles.url, projection: proyeccion, imageExtent: [e.min_x, e.min_y, e.max_x, e.max_y] }) });
        mapa.current.addLayer(imagenes[c.id]);
      }
      imagenes[c.id].setVisible(c.visible);
      imagenes[c.id].setOpacity(c.opacidad);
    }
  }, [capas]);

  useEffect(() => {
    const { fuentePuntos, capaPuntos } = refs.current;
    fuentePuntos.clear();
    for (const p of pois?.features ?? []) {
      const f = new Feature({ geometry: new Point(p.geometry.coordinates), tipo: "punto", ...p.properties });
      f.setId(p.id);
      fuentePuntos.addFeature(f);
    }
    capaPuntos.setStyle((f) => estiloPunto(f, idioma, seleccionados, numerar));
  }, [pois, idioma, seleccionados, numerar]);

  useEffect(() => {
    const { fuenteRutas } = refs.current;
    fuenteRutas.clear();
    for (const r of rutas?.routes ?? []) {
      const activo = r.profile === perfilActivo;
      const tramos = [[r.outbound.polyline, false], ...(r.return_trip ? [[r.return_trip.polyline, true]] : [])];
      for (const [linea, regreso] of tramos) {
        const f = new Feature({ geometry: new LineString(linea.map(([x, y]) => [x, y])) });
        f.setStyle(new Style({ zIndex: activo ? 2 : 1, stroke: new Stroke({
          color: COLORES[r.profile], width: activo ? 5 : 2.5, lineDash: regreso ? [8, 8] : undefined,
          lineCap: "round", lineJoin: "round" }) }));
        fuenteRutas.addFeature(f);
      }
    }
  }, [rutas, perfilActivo]);

  useEffect(() => {
    const { fuentePos } = refs.current;
    fuentePos.clear();
    if (posicion) fuentePos.addFeature(new Feature({ geometry: new Point(posicion) }));
  }, [posicion]);

  return <div ref={div} className="mapa" />;
}
