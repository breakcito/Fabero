import type { ElementoQuimicoValorizacion } from "../../../shared/enums/_generic/elemento-quimico-valorizacion";
import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export interface RES_CondicionComercialProveedor {
  id: number;
  id_proveedor_minero: number;
  elemento_quimico: ElementoQuimicoValorizacion;
  ley_inicio: number;
  ley_fin: number;
  maquila: number;
  recuperacion: number;
  consumo: number;
  riesgo_comercial: number;
  estado: EstadoBase;
  created_at?: string;
}