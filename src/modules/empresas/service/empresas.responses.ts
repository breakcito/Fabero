import type { CuentaBancariaItem } from "../../../shared/interfaces/cuenta-bancaria";

export interface RES_Empresa {
  id_empresa: number;
  ruc: string;
  razon_social: string;
  nombre_comercial: string;
  path_logo: string | null;
  cantidad_cuentas_bancarias?: number;
}

export interface CuentaBancariaEmpresaResponse extends CuentaBancariaItem {}
