import type { TipoIngreso, TipoCarga } from "../enums";

export interface CrearRecepcionRequest {
  id_vehiculo: number;
  id_empresa_transporte: number;
  id_tipo_vehiculo: number;
  id_conductor: number;
  tipo_ingreso: TipoIngreso;
  tipo_carga: TipoCarga;
  segunda_placa?: string;
  observacion?: string;
  evidencias?: File[];
}

export interface RecepcionFilters {
  fecha_inicio?: string;
  fecha_fin?: string;
  numero_placa?: string;
  serie_placa?: string;
  id_empresa_transporte?: number;
  tipo_ingreso?: string;
}
