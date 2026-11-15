// Marco local de la región (metros: x al este, y al norte) → coordenadas de la escena 3D.
// Es la fórmula de manifest.scene_transform; no la cambien: así terreno, rutas y puntos coinciden.
//   escena.x = (x − centro_x)·u     escena.y = (z − z_ref)·u·exageración     escena.z = −(y − centro_y)·u
export function crearTransformacion(manifiesto, exageracion = manifiesto.vertical_exaggeration_default ?? 1) {
  const t = manifiesto.scene_transform;
  const u = t.units_per_meter;
  return {
    u,
    exageracion,
    aEscena: (x, y, z) => [(x - t.center_x_m) * u, (z - t.z_ref_m) * u * exageracion, -(y - t.center_y_m) * u],
  };
}
