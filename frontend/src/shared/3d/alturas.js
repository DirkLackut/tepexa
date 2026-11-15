import UPNG from "upng-js";

// El heightmap es un PNG de 16 bits en escala de grises. Un TextureLoader lo reduciría a 8 bits y se perdería
// el relieve, por eso se decodifica a mano. Fila 0 = norte. Altura: z = z_min + valor/65535·(z_max − z_min).
const cache = new Map();

export function cargarAlturas(url, zMin, zMax) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`No se pudo descargar el heightmap (${r.status})`);
        return r.arrayBuffer();
      })
      .then((buffer) => {
        const img = UPNG.decode(buffer);
        if (img.depth !== 16 || img.ctype !== 0) throw new Error("El heightmap no es un PNG de 16 bits en grises");
        const n = img.width * img.height;
        const z = new Float32Array(n);
        const k = (zMax - zMin) / 65535;
        for (let i = 0; i < n; i++) z[i] = zMin + ((img.data[2 * i] << 8) | img.data[2 * i + 1]) * k;
        return { ancho: img.width, alto: img.height, z };
      })
      .catch((e) => { cache.delete(url); throw e; }));
  }
  return cache.get(url);
}
