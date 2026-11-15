// Llamadas a la API de TEPEXA que usa la escena. La URL se cambia con VITE_API_URL (archivo .env.local).
export const API_URL = import.meta.env.VITE_API_URL ?? "https://tepexa-api.onrender.com/api/v1";

async function pedir(ruta, opciones) {
  const r = await fetch(`${API_URL}${ruta}`, opciones);
  const cuerpo = await r.json().catch(() => null);
  if (!r.ok) {
    // Los errores de la API traen message: {es, en}. Se muestran tal cual (contracts/README.md).
    const e = new Error(cuerpo?.error?.message?.es ?? `Error ${r.status} en ${ruta}`);
    e.mensaje = cuerpo?.error?.message;
    e.status = r.status;
    throw e;
  }
  return cuerpo;
}

export const obtenerRegion = (regionId) => pedir(`/regions/${regionId}`);
export const obtenerTerreno = (regionId) => pedir(`/regions/${regionId}/terrain`);
export const obtenerPuntos = (regionId) => pedir(`/regions/${regionId}/pois`);
export const compararRutas = (peticion) =>
  pedir("/routes/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(peticion) });
