import type { MedioPagoComprobante } from "../../../shared/enums/contabilidad-compra/medio-pago-comprobante";
import type { TipoAprobacionComprobante } from "../../../shared/enums/contabilidad-compra/tipo-aprobacion-comprobante";

export interface REQ_FiltroComprobantes {
  id_proveedor?: number;
  estado?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface REQ_CrearComprobante {
  id_valorizacion_compra: number;
  serie: string;
  numero: string;
  fecha_emision: string;
  porcentaje_igv?: number;
  porcentaje_detraccion?: number;
  evidencias?: File[];
}

export interface REQ_AprobarComprobante {
  tipo: TipoAprobacionComprobante;
}

export interface REQ_AnularComprobante {
  motivo: string;
}

export interface REQ_CrearTipoCambio {
  valor_compra: number;
  valor_venta: number;
  fecha: string;
}

export interface REQ_RegistrarPago {
  id_cuenta_bancaria_empresa?: number | null;
  id_cuenta_bancaria_proveedor?: number | null;
  es_para_detraccion: boolean;
  medio_pago: MedioPagoComprobante;
  monto_pagado: number;
  fecha_hora_pago?: string;
  numero_operacion?: string | null;
  observacion?: string | null;
  evidencias?: File[];
}

export interface REQ_AnularPago {
  motivo: string;
  evidencias_anulacion?: File[];
}