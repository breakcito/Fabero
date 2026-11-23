/**
 * Resoluciones puras del autocompletado del modal "Registrar Guía".
 *
 * Se extraen del componente para poder verificarlas aisladas: no dependen de
 * React ni del estado del modal, solo de los datos de la unidad y del
 * proveedor.
 */

import type { IArchivo } from "../../../../shared/interfaces/archivo";

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

/** Guía de un proveedor dentro del contrato `guias` de una unidad. */
interface GuiaDeProveedor {
  id_proveedor: number;
  guia_remitente: string | null;
  guia_transportista: string | null;
  guia_remitente_archivo?: IArchivo | null;
  guia_transportista_archivo?: IArchivo | null;
}

/** Datos de la unidad que hacen falta para resolver las guías. */
interface UnidadConGuias {
  /** Guías por proveedor (contrato `guias` del modelo nuevo). */
  guias?: readonly GuiaDeProveedor[];
  /** Guías del proveedor principal (contrato legacy). */
  guia_remitente?: string | null;
  guia_transportista?: string | null;
  /** Archivos del proveedor principal (contrato legacy). */
  documentos?: {
    guia_remitente?: IArchivo | null;
    guia_transportista?: IArchivo | null;
  } | null;
  /** Proveedores de la carga: el primero es el principal. */
  proveedores?: readonly ProveedorSeleccionable[];
}

/** Guías y archivos que corresponden a un proveedor de una unidad. */
export interface GuiasDelProveedor {
  textoRemitente: string | null;
  textoTransportista: string | null;
  archivoRemitente: IArchivo | null;
  archivoTransportista: IArchivo | null;
}

/**
 * Resuelve las guías y sus archivos de un proveedor dentro de una unidad.
 *
 * Las guías son DEL PROVEEDOR ELEGIDO: si ese proveedor tiene entrada en el
 * contrato `guias` se usan sus textos y sus archivos. Solo el proveedor
 * principal de la unidad conserva los suyos si el contrato `guias` no los
 * trae (unidades registradas antes del modelo multi-proveedor).
 *
 * Con un proveedor que no tiene guías en esa unidad el resultado es vacío:
 * no se rellena con las guías de otro proveedor.
 */
export const guiasDelProveedor = (
  unidad: UnidadConGuias,
  idProveedor: number | null,
): GuiasDelProveedor => {
  const vacio: GuiasDelProveedor = {
    textoRemitente: null,
    textoTransportista: null,
    archivoRemitente: null,
    archivoTransportista: null,
  };

  if (idProveedor === null) return vacio;

  const guia = unidad.guias?.find((g) => g.id_proveedor === idProveedor);
  if (guia) {
    return {
      textoRemitente: guia.guia_remitente ?? null,
      textoTransportista: guia.guia_transportista ?? null,
      archivoRemitente: guia.guia_remitente_archivo ?? null,
      archivoTransportista: guia.guia_transportista_archivo ?? null,
    };
  }

  const esProveedorPrincipal =
    unidad.proveedores?.[0]?.id_proveedor === idProveedor;
  if (!esProveedorPrincipal) return vacio;

  return {
    textoRemitente: unidad.guia_remitente ?? null,
    textoTransportista: unidad.guia_transportista ?? null,
    archivoRemitente: unidad.documentos?.guia_remitente ?? null,
    archivoTransportista: unidad.documentos?.guia_transportista ?? null,
  };
};
