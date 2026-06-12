import type { EstadoBase } from "../../shared/enums/_generic/estado-base";

export interface RES_EmpresaTransporte {
  id_empresa_transporte: number;
  ruc: string;
  razon_social: string;
  estado: EstadoBase;
}
