import type { ElementoQuimicoValorizacion } from "../../../shared/enums/_generic/elemento-quimico-valorizacion";

export interface DTO_CrearCondicionComercial {
  id_proveedor_minero: number;
  elemento_quimico: ElementoQuimicoValorizacion;
  ley_inicio: number;
  ley_fin: number;
  maquila: number;
  recuperacion: number;
  consumo: number;
  riesgo_comercial: number;
}

export interface DTO_ActualizarCondicionComercial {
  elemento_quimico: ElementoQuimicoValorizacion;
  ley_inicio: number;
  ley_fin: number;
  maquila: number;
  recuperacion: number;
  consumo: number;
  riesgo_comercial: number;
}