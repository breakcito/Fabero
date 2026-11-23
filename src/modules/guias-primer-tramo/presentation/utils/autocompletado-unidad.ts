/**
 * Resoluciones puras del autocompletado del modal "Registrar Guía".
 *
 * Se extraen del componente para poder verificarlas aisladas: no dependen de
 * React ni del estado del modal, solo de los datos de la unidad y del
 * proveedor.
 */

/** Datos mínimos de una concesión para resolver la selección. */
interface ConcesionSeleccionable {
  id_concesion: number;
}

/** Datos mínimos de un proveedor para resolver la selección. */
interface ProveedorSeleccionable {
  id_proveedor: number;
}

/**
 * Elige la concesión que debe quedar en el selector.
 *
 * - Si la selección actual sigue existiendo en la lista del proveedor se
 *   conserva: el autocompletado nunca pisa lo que eligió el operador.
 * - Si la selección actual no pertenece al proveedor (cambió el proveedor) se
 *   toma la primera concesión disponible.
 * - Si el proveedor no tiene concesiones se deja el selector vacío para que el
 *   operador use el botón de asociar/crear concesión.
 */
export const resolverConcesionSeleccionada = (
  concesiones: readonly ConcesionSeleccionable[],
  seleccionActual: string | null,
): string | null => {
  if (
    seleccionActual !== null &&
    concesiones.some((c) => String(c.id_concesion) === seleccionActual)
  ) {
    return seleccionActual;
  }
  if (concesiones.length === 0) return null;
  return String(concesiones[0].id_concesion);
};

/**
 * Elige el proveedor que debe quedar en el selector al elegir una unidad.
 *
 * - Si el proveedor actual sigue entre los proveedores de la carga se conserva.
 * - Si la carga tiene un único proveedor se selecciona: con una sola opción no
 *   hay decisión que tomar.
 * - Si la carga tiene varios proveedores y ninguno coincide se deja vacío.
 */
export const resolverProveedorUnidad = (
  proveedores: readonly ProveedorSeleccionable[],
  seleccionActual: string | null,
): string | null => {
  if (
    seleccionActual !== null &&
    proveedores.some((p) => String(p.id_proveedor) === seleccionActual)
  ) {
    return seleccionActual;
  }
  if (proveedores.length === 1) return String(proveedores[0].id_proveedor);
  return null;
};
