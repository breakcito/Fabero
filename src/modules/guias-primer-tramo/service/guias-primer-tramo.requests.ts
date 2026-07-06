import type { MotivoTraslado } from "../../../shared/enums/_generic/motivo-traslado";

export interface DTO_LoteGuiaInput {
  id_lote_mineral: number;
  correlativo: string;
  peso_bruto: number;
  tara: number;
}

export interface DTO_CrearGuiaPrimerTramo {
  id_sucursal: number;
  id_proveedor: number;
  id_concesion: number;
  id_conductor: number;
  id_vehiculo: number;
  id_empresa_transporte: number | null;
  id_vehiculo_carreta: number | null;
  id_empresa_transporte_carreta: number | null;
  motivo_traslado: MotivoTraslado | string;
  fecha_inicio_traslado: string | null;
  fecha_emision: string | null;
  fecha_en_planta: string | null;
  serie_guia_remitente: string | null;
  numero_guia_remitente: string | null;
  serie_guia_transportista: string | null;
  numero_guia_transportista: string | null;
  sin_guia_transportista: boolean;
  lotes: DTO_LoteGuiaInput[];
  evidencias: File[];
}