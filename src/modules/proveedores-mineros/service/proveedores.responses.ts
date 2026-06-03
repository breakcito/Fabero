import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export interface ProveedorResponse {
  id_proveedor: number;
  tipo_entidad: string;
  dni: string | null;
  ruc: string | null;
  razon_social: string;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  cantidad_cuentas_bancarias: number;
  estado: EstadoBase;
}



export interface CuentaBancariaResponse {
  id_cuenta_bancaria: number;
  banco_abv: string;
  banco: string;
  id_banco: number;
  moneda: string; // MONEDAS
  numero_cuenta: string;
  cci: string | null;
  es_para_detraccion: boolean;
  estado: EstadoBase;
}
