import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDronConAleteo } from "../shared/3d/DronAnimado.jsx";

/** Dron que acompaña al tripulante: adelante y a un costado, con aleteo (ver shared/3d/DronAnimado.jsx). */
export function Dron({ modelo, objetivo, envergadura = 0.9 }) {
  const { copia, escala } = useDronConAleteo(modelo, envergadura);
  const grupo = useRef();
  const pos = useMemo(() => new THREE.Vector3(), []);
  useFrame((estado, delta) => {
    const o = objetivo.current;
    if (!o || !grupo.current) return;
    // Adelante y a un costado del tripulante, a la altura de su cabeza y un poco más, con un balanceo suave.
    const t = estado.clock.elapsedTime;
    const a = o.altura, lado = a * (1.1 + Math.sin(t * 0.6) * 0.2);
    pos.set(o.x + o.fx * a - o.fz * lado, o.y + a * 1.1 + Math.sin(t * 1.3) * a * 0.08, o.z + o.fz * a + o.fx * lado);
    // Posición pegada al tripulante (sin retraso): a velocidades ×300 un seguimiento suavizado quedaba atrás,
    // entre la cámara y el tripulante. El balanceo ya lo da el seno.
    grupo.current.position.copy(pos);
    grupo.current.rotation.y = THREE.MathUtils.lerp(grupo.current.rotation.y, o.giro, Math.min(1, delta * 3));
  });

  return <group ref={grupo} scale={escala}><primitive object={copia} /></group>;
}
