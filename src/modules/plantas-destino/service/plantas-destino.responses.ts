import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type { Moneda } from "../../../shared/enums/_generic/moneda";

export interface PlantaDestinoResponse {
  id: number;
  ruc: string;
  razon_social: string;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  cantidad_cuentas: number;
  cantidad_proveedores: number;
  estado: EstadoBase;
}

export interface CuentaBancariaPlantaResponse {
  id_cuenta_bancaria: number;
  banco_abv: string;
  banco: string;
  id_banco: number;
  moneda: Moneda;
  numero_cuenta: string;
  cci: string | null;
  es_para_detraccion: boolean;
  estado: EstadoBase;
}
