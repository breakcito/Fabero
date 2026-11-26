import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type { CuentaBancariaItem } from "../../../shared/interfaces/cuenta-bancaria";

export interface ProveedorResponse {
  id_proveedor: number;
  tipo_entidad: string;
  dni: string | null;
  ruc: string | null;
  razon_social: string;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  origen_guias: string | null;
  destino_guias: string | null;
  cantidad_cuentas_bancarias: number;
  cantidad_contactos: number;
  estado: EstadoBase;
}

/** Contacto registrado de un proveedor. */
export interface RES_ContactoProveedor {
  id: number;
  id_proveedor: number;
  id_empleado_registro: number;
  nombre_completo: string;
  dni: string | null;
  telefono: string | null;
  correo: string | null;
  created_at: string | null;
  /** Nombre del empleado que registró el contacto (solo en el listado). */
  empleado_registro_nombre?: string | null;
}

/**
 * Contacto que debe figurar en los documentos del proveedor.
 *
 * Si el proveedor no tiene contactos registrados, el propio proveedor es el
 * contacto y se replican su razón social, teléfono y correo.
 */
export interface RES_ContactoDocumento {
  id_contacto: number | null;
  nombre: string | null;
  telefono: string | null;
  correo: string | null;
  origen: "contacto" | "proveedor";
}

export type CuentaBancariaResponse = CuentaBancariaItem;
