import type { ElementoQuimicoValorizacion } from "../../../shared/enums/_generic/elemento-quimico-valorizacion";
import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export interface RES_CondicionComercialPlanta {
  id: number;
  id_planta: number;
  elemento_quimico: ElementoQuimicoValorizacion;
  ley_inicio: number | null;
  ley_fin: number | null;
  maquila: number | null;
  recuperacion: number | null;
  consumo: number | null;
  riesgo_comercial: number | null;
  estado: EstadoBase;
  created_at?: string;
}
