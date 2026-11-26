import type { IArchivo } from "./archivo";

/**
 * Guías de un proveedor dentro de una recepción de unidad.
 *
 * Una recepción puede traer la carga de varios proveedores: cada proveedor
 * tiene su propio par de guías (remitente / transportista) y sus archivos
 * adjuntos.
 */
export interface IGuiaRecepcion {
  id_proveedor: number;
  guia_remitente: string;
  guia_transportista: string;
  guia_remitente_archivo: IArchivo | null;
  guia_transportista_archivo: IArchivo | null;
  /**
   * La guía es interna: la emite la propia empresa, no un proveedor.
   *
   * Sólo aplica a las guías de SALIDA (`guias_salida`): cuando es `true`
   * no hay que elegir ni indicar proveedor.
   */
  es_interno?: boolean;
}

/**
 * Proveedor de la carga que trae una recepción de unidad.
 */
export interface IProveedorRecepcion {
  id_proveedor: number;
  razon_social: string;
  ruc?: string | null;
}

/**
 * Payload para reemplazar el array de guías de una recepción de unidad
 * (`PUT /api/recepcion-unidades/{id}/guias-recepcion`).
 */
export interface IDTO_GuiasRecepcion {
  guias: IGuiaRecepcion[];
}

/**
 * Payload para sincronizar los proveedores de una recepción de unidad
 * (`PUT /api/recepcion-unidades/{id}/proveedores`).
 */
export interface IDTO_ProveedoresRecepcion {
  proveedores: number[];
}
