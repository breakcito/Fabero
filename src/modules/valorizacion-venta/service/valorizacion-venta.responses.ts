import type { EstadoValorizacionVenta } from "../../../shared/enums/valorizacion-venta/estado-valorizacion-venta";
import type { ElementoQuimicoValorizacion } from "../../../shared/enums/_generic/elemento-quimico-valorizacion";
import type { IArchivo } from "../../../shared/interfaces/archivo";

export interface RES_ValorizacionVentaDetalle {
  id: number;
  id_valorizacion_venta: number;
  id_distribucion_detalle: number;
  id_condicion_comercial: number | null;
  id_valor_elemento_quimico: number | null;
  elemento_quimico: ElementoQuimicoValorizacion;
  despacho_correlativo: string | null;
  lote_correlativo: string | null;
  blending_correlativo: string | null;
  codigo_cliente: string | null;
  tmh: number;
  ley_humedad: number;
  tms: number;
  ley: number;
  inter: number;
  des_inter: number;
  recuperacion: number;
  maquila: number;
  consumo: number;
  factor: number;
  precio_por_tonelada: number;
  subtotal: number;
  log_cambios?: Record<string, unknown>[];
}

export interface RES_ValorizacionVenta {
  id: number;
  numero_correlativo: string;
  correlativo: string | null;
  id_planta: number;
  planta_ruc: string | null;
  planta_nombre: string | null;
  codigo: string | null;
  estado: EstadoValorizacionVenta;
  created_at: string;
  fecha_hora_valorizacion: string | null;
  fecha_hora_aprobacion: string | null;
  fecha_hora_anulacion: string | null;
  monto_penalidad: number;
  monto_flete: number;
  empleado_registro: string | null;
  empleado_aprobacion: string | null;
  empleado_anulacion: string | null;
  motivo_anulacion: string | null;
  evidencias_anulacion?: (IArchivo | string)[];
  log_cambios?: Record<string, unknown>[];
  total_subtotal: number;
  evidencias?: (IArchivo | string)[];
  detalles: RES_ValorizacionVentaDetalle[];
}

export interface RES_CondicionEncontrada {
  id_condicion_comercial: number;
  recuperacion: number;
  maquila: number;
  consumo: number;
}

export interface RES_DistribucionDetalleDisponible {
  id_distribucion_detalle: number;
  id_distribucion: number;
  id_despacho_detalle: number;
  numero_particion: number | null;
  peso_neto_cliente: number;
  ley_oro_cliente: number;
  ley_plata_cliente: number;
  ley_humedad_cliente: number;
  codigo_cliente: string | null;
  esta_valorizado_oro: boolean;
  esta_valorizado_plata: boolean;
  fecha_llegada_cliente: string | null;
  id_despacho: number;
  despacho_correlativo: string | null;
  id_planta: number;
  planta_nombre: string;
  id_lote_mineral: number | null;
  id_blending: number | null;
  lote_correlativo: string | null;
  lote_ley_oro: number | null;
  lote_ley_plata: number | null;
  lote_ley_humedad: number | null;
  blending_correlativo: string | null;
  // Condición comercial auto-encontrada por rango de ley del elemento.
  condicion_oro: RES_CondicionEncontrada | null;
  condicion_plata: RES_CondicionEncontrada | null;
}

export interface RES_CondicionComercialPlanta {
  id: number;
  id_planta: number;
  elemento_quimico: "Oro" | "Plata";
  ley_inicio: number;
  ley_fin: number;
  maquila: number;
  recuperacion: number;
  consumo: number;
  riesgo_comercial: number;
}
