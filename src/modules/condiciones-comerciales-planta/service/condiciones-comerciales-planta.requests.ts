import type { ElementoQuimicoValorizacion } from "../../../shared/enums/_generic/elemento-quimico-valorizacion";

export interface DTO_CrearCondicionComercialPlanta {
  id_planta: number;
  elemento_quimico: ElementoQuimicoValorizacion;
  ley_inicio?: number | null;
  ley_fin?: number | null;
  maquila?: number | null;
  recuperacion?: number | null;
  consumo?: number | null;
  riesgo_comercial?: number | null;
}

export interface DTO_ActualizarCondicionComercialPlanta {
  elemento_quimico: ElementoQuimicoValorizacion;
  ley_inicio?: number | null;
  ley_fin?: number | null;
  maquila?: number | null;
  recuperacion?: number | null;
  consumo?: number | null;
  riesgo_comercial?: number | null;
}
