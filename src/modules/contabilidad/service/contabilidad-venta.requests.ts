import type { MedioPagoComprobanteVenta } from "../../../shared/enums/contabilidad-venta/medio-pago-comprobante-venta";

export interface REQ_FiltroComprobantesVenta {
  id_planta?: number;
  estado?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface REQ_AnticipoAplicado {
  id_anticipo_planta: number;
  monto_retirado: number;
}

export interface REQ_CrearComprobanteVenta {
  id_planta_destino: number;
  id_empresa?: number;
  id_tipo_cambio: number;
  codigo_comprobante: string;
  fecha_emision: string;
  detalles_ids: number[];
  monto_penalidad?: number;
  monto_flete?: number;
  percentaje_igv?: number;
  porcentaje_detraccion?: number;
  anticipos?: REQ_AnticipoAplicado[];
  evidencias?: File[];
}

export interface REQ_AnularComprobanteVenta {
  motivo: string;
  evidencias?: File[];
}

export interface REQ_RegistrarPagoVenta {
  id_cuenta_bancaria_planta?: number | null;
  id_cuenta_bancaria_empresa?: number | null;
  es_para_detraccion: boolean;
  medio_pago: MedioPagoComprobanteVenta;
  monto_pagado: number;
  fecha_hora_pago?: string;
  numero_operacion?: string | null;
  observacion?: string | null;
  evidencias?: File[];
}

export interface REQ_AnularPagoVenta {
  motivo: string;
  evidencias_anulacion?: File[];
}
