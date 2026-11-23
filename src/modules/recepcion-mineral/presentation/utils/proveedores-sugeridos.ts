import type { RES_Proveedor } from "../../../../service/responses/proveedor";
import type { IProveedorRecepcion } from "../../../../shared/interfaces/guia-recepcion";

/**
 * Marca que se añade a las opciones "sugeridas" del selector de proveedor
 * (los proveedores de la carga que trajo la unidad) para que el operador las
 * distinga del resto del catálogo.
 */
const MARCA_SUGERIDO = " · de esta unidad";

export interface OpcionProveedor {
  value: string;
  label: string;
}

/**
 * Construye las opciones del selector de proveedor de los modales de pesaje.
 *
 * Las opciones sugeridas (los proveedores de `proveedor_recepcion` de la
 * unidad) van PRIMERO y marcadas; detrás queda el resto del catálogo, que
 * sigue disponible para que el operador elija otro proveedor.
 */
export const opcionesProveedor = (
  catalogo: RES_Proveedor[],
  sugeridos: IProveedorRecepcion[],
): OpcionProveedor[] => {
  const porId = new Map<number, OpcionProveedor>();

  for (const p of catalogo) {
    if (typeof p.id_proveedor !== "number") {
      continue;
    }

    porId.set(p.id_proveedor, {
      value: String(p.id_proveedor),
      label: `${p.razon_social} (${p.documento})`,
    });
  }

  // Los sugeridos van PRIMERO y en el orden de registro de la unidad (el
  // proveedor principal de la carga encabeza la lista).
  const sugeridas: OpcionProveedor[] = [];
  for (const s of sugeridos) {
    const base = porId.get(s.id_proveedor);
    if (!base) {
      continue;
    }
    sugeridas.push({ ...base, label: `${base.label}${MARCA_SUGERIDO}` });
    porId.delete(s.id_proveedor);
  }

  // Detrás queda el resto del catálogo, que sigue disponible.
  const resto: OpcionProveedor[] = [];
  for (const opcion of porId.values()) {
    resto.push(opcion);
  }

  return [...sugeridas, ...resto];
};

/**
 * Proveedor con el que se abre el modal de pesaje.
 *
 * Prioridad (regla de negocio): proveedor de la CARGA del lote → proveedor
 * principal de la UNIDAD → primer proveedor sugerido de la unidad.
 */
export const resolverProveedorInicial = (
  idProveedorCarga: number | null | undefined,
  idProveedorUnidad: number | null | undefined,
  idProveedorSugerido: number | null | undefined,
): string | null => {
  const id = idProveedorCarga ?? idProveedorUnidad ?? idProveedorSugerido ?? null;

  return id !== null ? String(id) : null;
};
