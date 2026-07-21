import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export interface RES_CondicionComercialProveedor {
  id: number;
  id_proveedor_minero: number;
  ley_auoz_inicio: number;
  ley_auoz_fin: number;
  maquila: number;
  recuperacion: number;
  consumo: number;
  riesgo_comercial: number;
  estado: EstadoBase;
  created_at?: string;
}
