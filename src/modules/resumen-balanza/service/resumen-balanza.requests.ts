export interface DTO_ResumenBalanzaFiltros {
  id_sucursal: number;
  fecha_inicio?: string; // YYYY-MM-DD
  fecha_fin?: string; // YYYY-MM-DD
  tipo_ingreso?: string;
  placa?: string;
  id_lote_mineral?: number;
  id_empresa_transporte?: number;
}
