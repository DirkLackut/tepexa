import { useMemo } from "react";
import { Line } from "@react-three/drei";

/**
 * Dibuja una polilínea de la API ([x, y, z] en metros locales) sobre el terreno.
 * La z ya viene del mismo DTM: solo se eleva `elevar_m` para que la línea no quede tapada por el suelo.
 * Es la MISMA polilínea del mapa 2D y del informe: no se recalcula nada en el navegador.
 */
export function RutaEnTerreno({ polilinea, transformacion, color, grosor = 3, elevar_m = 4, discontinua = false }) {
  const puntos = useMemo(
    () => polilinea.map(([x, y, z]) => transformacion.aEscena(x, y, z + elevar_m)),
    [polilinea, transformacion, elevar_m],
  );
  return <Line points={puntos} color={color} lineWidth={grosor} dashed={discontinua} dashSize={0.3} gapSize={0.2} />;
}
