# Catálogo de datos de TEPEXA

Qué datos de NASA (y agencias socias) usa la app, para qué, con qué resolución y dónde se
guardan. Es la versión legible de la tabla `sources` de la base y de los manifiestos de la
spec 002. Constitución, principio 1: todo lo que se muestra cita su fuente.

> Estado: **plan** (14-nov-2026). Los identificadores de producto se fijan en la spec 002 al
> descargar y verificar cada archivo. Ningún dato de esta tabla se presenta como usado hasta
> entonces.

## Resumen: qué dato sirve para qué

| Dato | Misión / instrumento | Resolución | Cobertura | Uso en TEPEXA |
|---|---|---|---|---|
| **HiRISE DTM** | MRO / HiRISE | ~1 m por píxel | Franjas de pocos km | **Rutas (A\*), terreno 3D, perfil de elevación** de la Margin Unit |
| **HiRISE ortoimagen** | MRO / HiRISE | ~25 cm por píxel | Igual que el DTM | **Mapa base 2D** y **textura del terreno 3D** |
| **CTX DTM y ortoimagen** | MRO / Context Camera | ~20 m (DTM), ~6 m (imagen) | Todo el cráter Jezero | **Vista de contexto** al alejar el mapa; respaldo si HiRISE no cubre un punto |
| **HRSC** | Mars Express (ESA) / HRSC | ~12.5–50 m, en color | Regional | **Contexto regional en color**; imágenes de **Medusae Fossae** (próxima misión) |
| **MOLA** (y MOLA-HRSC 200 m) | Mars Global Surveyor / MOLA | ~463 m (200 m combinado) | Global | **Ubicación en el planeta**, relieve de fondo y ficha de Medusae Fossae. **Nunca para rutas** |
| **THEMIS inercia térmica** | Mars Odyssey / THEMIS | ~100 m | Global | Capa de **suelo suelto** y factor de costo del perfil «más segura» |
| **CRISM** | MRO / CRISM | ~18 m | Parches | Capa de **mineralogía orbital** (carbonato, olivino) frente a lo que halló el rover |
| **Fotos de Perseverance** | Mars 2020 / Mastcam-Z, Navcam | — | Puntos de la travesía | **Imágenes en primera persona** de los puntos de interés |
| **Travesía de Perseverance** | Mars 2020 | — | Ruta real del rover | **Ubicar los puntos de interés** de la Margin Unit y comparar con nuestras rutas |

## Por qué cada escala
- Una caminata se decide a escala de metros: solo **HiRISE** (≈1 m) da pendientes útiles.
- **CTX** sirve para ver dónde está la franja de HiRISE dentro del cráter.
- **HRSC** da color y contexto regional; en Medusae Fossae es la mejor vista disponible para el avance.
- **MOLA** es demasiado grueso para caminar (un píxel ≈ media cuadra de 463 m), pero ubica la región en
  el globo. Usarlo para rutas daría pendientes falsas.

## Productos candidatos (se verifican en la spec 002)

| Producto | Fuente | Para |
|---|---|---|
| Mars 2020 TRN HiRISE DTM Mosaic (1 m) | USGS Astrogeology | Rutas y 3D de Jezero |
| Mars 2020 TRN HiRISE Orthorectified Image Mosaic (25 cm) | USGS Astrogeology | Mapa base y textura |
| Mars 2020 TRN CTX DTM y ortomosaico | USGS Astrogeology | Contexto del cráter |
| Mars MGS MOLA – MEX HRSC Blended DEM Global 200 m | USGS Astrogeology | Globo y Medusae |
| Mapa de inercia térmica de THEMIS | ASU / NASA | Suelo suelto |
| Productos CRISM de Jezero | PDS Geosciences | Mineralogía |

### Productos elegidos (15-nov-2026)

| Producto | Archivo | Tamaño | Cobertura | Cita |
|---|---|---|---|---|
| DTM HiRISE 1 m | `JEZ_hirise_soc_006_DTM_MOLAtopography_DeltaGeoid_1m_Eqc_latTs0_lon0_blend40.tif` | 1.8 GB | lat 18.3068–18.6693 N, lon 77.2229–77.584 E (equirectangular, planetocéntrica) | Fergason et al. (2020), USGS Astrogeology, [doi:10.5066/P9REJ9JN](https://doi.org/10.5066/P9REJ9JN) |
| Ortoimagen HiRISE 25 cm | `JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first.tif` | 6.9 GB | La misma | Fergason et al. (2020), USGS Astrogeology, [doi:10.5066/P9QJDP48](https://doi.org/10.5066/P9QJDP48), CC0 1.0 |
| Travesía de Perseverance | `M20_waypoints.json` | pocos MB | Toda la misión | NASA/JPL-Caltech (MMGIS) |

**Cómo se obtuvo el DTM (15-nov):** sin descargar el archivo. El GeoTIFF no está comprimido y el servidor
acepta rangos de bytes, así que el navegador integrado leyó solo las filas del recorte de 4 × 3 km y las
mandó al entorno de trabajo ya remuestreadas a 2 m. Verificación: en los 5 sitios de muestra la altura del
DTM coincide con la de Perseverance con un error de 0.01 a 0.19 m. La ortoimagen (6.9 GB) queda pendiente.

**Riesgo principal:** que el mosaico HiRISE de navegación de Mars 2020 no cubra toda la Margin Unit.
Si no la cubre, se busca un DTM HiRISE individual de la zona en el PDS, o se usa CTX con la
advertencia `LOW_DATA_RESOLUTION`.

## Cómo fluyen los datos

```
Descarga (PC de Dirk)  →  pipeline/ (recorte, alineación, reproyección al marco local)
   →  teselas, mapa de alturas PNG 16 bits, textura WebP  →  Cloudflare R2
   →  manifiesto con versión, hash y transformaciones
   →  Neon: tablas sources, layers, pois (URL y metadatos, nunca los archivos)
   →  API: /layers, /terrain, /routes/compare  →  frontend
```

El motor de rutas lee el DTM recortado (en memoria del servidor), no las imágenes.

## Créditos (texto para la app y la entrega)
Se completan con el producto exacto en la spec 002. Base:
- HiRISE: NASA/JPL-Caltech/University of Arizona.
- CTX: NASA/JPL-Caltech/MSSS.
- HRSC: ESA/DLR/FU Berlin.
- MOLA: NASA/JPL-Caltech/GSFC.
- THEMIS: NASA/JPL-Caltech/Arizona State University.
- CRISM: NASA/JPL-Caltech/JHU-APL.
- Mosaicos de Mars 2020: USGS Astrogeology Science Center.
