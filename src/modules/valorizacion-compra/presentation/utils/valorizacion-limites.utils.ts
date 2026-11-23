/**
 * Límites de la propuesta de valorización de compra.
 *
 * Una propuesta puede contener como máximo 10 lotes (items). Cada lote admite
 * hasta 2 elementos (Oro y Plata), por lo que el máximo real es de 20 detalles
 * (elementos) por propuesta.
 */

/** Máximo de lotes (items) admitidos en una propuesta. */
export const MAX_LOTES_POR_PROPUESTA = 10;

/** Máximo de elementos (detalles) admitidos en una propuesta: 10 lotes x 2 elementos. */
export const MAX_ELEMENTOS_POR_PROPUESTA = MAX_LOTES_POR_PROPUESTA * 2;

/** Mensaje unificado del límite, usado en el formulario y en el modal de lotes. */
export const MENSAJE_MAX_LOTES = `Solo se puede valorizar un máximo de ${MAX_LOTES_POR_PROPUESTA} lotes (items) por propuesta, equivalente a ${MAX_ELEMENTOS_POR_PROPUESTA} elementos (Oro/Plata).`;
