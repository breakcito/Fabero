import type { EstadoBase } from "../enums/_generic/estado-base";
import type { Moneda } from "../enums/_generic/moneda";

/**
 * Forma base de una cuenta bancaria tal como la devuelve cualquier
 * endpoint del backend. Los tres módulos (proveedor, empresa, planta)
 * exponen exactamente este mismo shape JSON.
 */
export interface CuentaBancariaItem {
  id_cuenta_bancaria: number;
  banco: string;
  banco_abv: string;
  id_banco: number;
  moneda: Moneda;
  numero_cuenta: string;
  cci: string | null;
  es_para_detraccion: boolean;
  estado: EstadoBase;
}

/**
 * Payload que el componente de registro construye y entrega al adapter.
 * NO incluye el FK padre (id_proveedor | id_empresa | id_planta_destino);
 * el adapter lo inyecta con la clave correcta.
 */
export interface CrearCuentaBancariaPayload {
  id_banco: number;
  moneda: Moneda;
  numero_cuenta: string;
  cci?: string | null;
  es_para_detraccion: 1 | 0;
}

export type EditarCuentaBancariaPayload = CrearCuentaBancariaPayload;

export type ParentIdField = "id_proveedor" | "id_empresa" | "id_planta_destino";

/**
 * Contrato que cada módulo implementa para conectar su backend con la UI
 * reutilizable de `presentation/utils/cuentas-bancarias`.
 */
export interface CuentasBancariasAdapter<
  T extends CuentaBancariaItem,
  TEntity,
> {
  /** Nombre del campo FK en los payloads POST/PUT. */
  parentIdField: ParentIdField;
  /** Extrae el id padre (ej. `id_proveedor`, `id_empresa`, `id` para plantas). */
  getParentId: (entity: TEntity) => number;
  /** Etiqueta humana de la entidad padre para títulos de modal. */
  getEntityLabel: (entity: TEntity) => string;
  /** API: listar cuentas del padre. */
  fetchCuentas: (parentId: number) => Promise<T[]>;
  /** API: crear cuenta. El adapter añade el FK padre internamente. */
  crearCuenta: (
    parentId: number,
    payload: CrearCuentaBancariaPayload,
  ) => Promise<T>;
  /** API: editar cuenta. */
  editarCuenta: (
    id: number,
    payload: EditarCuentaBancariaPayload,
  ) => Promise<T>;
  /** API: alternar estado. */
  cambiarEstado: (id: number, estado: EstadoBase) => Promise<T>;
  /** API: eliminación física (opcional — proveedor y empresa lo exponen). */
  eliminar?: (id: number) => Promise<void>;
}
