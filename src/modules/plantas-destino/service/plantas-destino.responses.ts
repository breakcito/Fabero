import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type { CuentaBancariaItem } from "../../../shared/interfaces/cuenta-bancaria";

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

export interface CuentaBancariaPlantaResponse extends CuentaBancariaItem {}
