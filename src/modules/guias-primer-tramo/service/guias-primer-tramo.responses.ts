import type { MotivoTraslado } from "../../../shared/enums/_generic/motivo-traslado";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export interface RES_ConcesionPorProveedor {
  id_concesion: number;
  id_departamento: number | null;
  departamento: string | null;
  id_provincia: number | null;
  provincia: string | null;
  id_distrito: number | null;
  distrito: string | null;
  nombre: string;
  codigo_reinfo: string | null;
  estado: string | null;
  id_concesion_proveedor: number;
}

import type { RES_CambiosLog } from "../../../service/responses/_generic/cambios-log";

export interface RES_LoteGuia {
  id: number;
  id_guia_primer_tramo: number;
  id_lote_mineral: number;
  peso_bruto: number | null;
  tara: number | null;
  peso_neto: number | null;
  lote_correlativo: string | null;
  tipo_producto: string | null;
  tipo_mineral: string | null;
  log_cambios?: RES_CambiosLog[] | null;
}

export interface RES_GuiaPrimerTramo {
  id: number;
  id_sucursal: number;
  sucursal_nombre?: string;
  id_proveedor: number;
  proveedor_razon_social?: string;
  proveedor_documento?: string | null;
  id_concesion: number;
  concesion_nombre?: string | null;
  id_conductor: number;
  conductor_nombre?: string;
  conductor_dni?: string;
  conductor_licencia?: string | null;
  id_vehiculo: number;
  vehiculo_serie?: string | null;
  vehiculo_placa?: string | null;
  id_empresa_transporte: number | null;
  empresa_transporte_razon_social?: string | null;
  id_vehiculo_carreta: number | null;
  vehiculo_carreta_serie?: string | null;
  vehiculo_carreta_placa?: string | null;
  id_empresa_transporte_carreta: number | null;
  empresa_transporte_carreta_razon_social?: string | null;
  qr_token_transportista: string | null;
  qr_token_remitente: string | null;
  motivo_traslado: MotivoTraslado | string | null;
  evidencias: Array<{ nombre: string; ruta: string }> | string[] | null;
  fecha_inicio_traslado: string | null;
  fecha_emision: string | null;
  fecha_en_planta: string | null;
  serie_guia_remitente: string | null;
  numero_guia_remitente: string | null;
  serie_guia_transportista: string | null;
  numero_guia_transportista: string | null;
  sin_guia_transportista: boolean;
  id_empleado_registro: number | null;
  log_cambios: RES_CambiosLog[] | null;
  estado: EstadoBase;
  created_at: string;
  lotes: RES_LoteGuia[];
}

export interface RES_LoteMineralDisponible {
  id: number;
  id_recepcion_unidad: number;
  id_proveedor_minero: number | null;
  correlativo: string;
  numero_correlativo: number;
  tipo_producto: string | null;
  tipo_mineral: string | null;
  tipo_carga: string | null;
  peso_inicial: number | null;
  peso_final: number | null;
  peso_neto: number | null;
  created_at: string;
  proveedor_nombre: string | null;
  vehiculo_placa?: string | null;
  vehiculo_serie?: string | null;
  en_guia: boolean;
}

export interface RES_FiltrosMetadataGuia {
  proveedores: Array<{ id: number; razon_social: string }>;
}