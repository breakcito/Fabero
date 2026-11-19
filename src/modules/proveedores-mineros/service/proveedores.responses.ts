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
  estado: EstadoBase;
}

export type CuentaBancariaResponse = CuentaBancariaItem;
