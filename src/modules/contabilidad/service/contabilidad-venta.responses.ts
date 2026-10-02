import type { EstadoComprobanteVenta } from "../../../shared/enums/contabilidad-venta/estado-comprobante-venta";
import type { TipoPagoComprobanteVenta } from "../../../shared/enums/contabilidad-venta/tipo-pago-comprobante-venta";
import type { IArchivo } from "../../../shared/interfaces/archivo";

export interface RES_LoteValorizadoVenta {
  id: number;
  id_comprobante_venta: number;
  id_valorizacion_venta_detalle: number;
  id_valorizacion_venta: number;
  valorizacion_correlativo: string;
  valorizacion_codigo: string;
  elemento_quimico: string;
  subtotal: number;
  precio_por_tonelada: number;
  lote_correlativo: string | null;
  codigo_preliminar: string | null;
  despacho_correlativo: string | null;
  blending_correlativo: string | null;
  codigo_cliente: string | null;
}

export interface RES_TransaccionAnticipoPlanta {
  id: number;
  id_anticipo_planta: number;
  id_comprobante_venta: number;
  saldo_actual: number;
  monto_retirado: number;
  estado: string;
  created_at: string;
  anticipo_codigo?: string | null;
}

export interface RES_PagoComprobanteVenta {
  id: number;
  id_comprobante_venta: number;
  id_cuenta_bancaria_planta: number | null;
  id_cuenta_bancaria_empresa: number | null;
  id_empleado_registro: number;
  id_empleado_anulacion: number | null;
  es_para_detraccion: boolean;
  medio_pago: string;
  monto_pagado: number;
  fecha_hora_pago: string;
  numero_operacion: string | null;
  observacion: string | null;
  evidencias?: IArchivo[];
  created_at: string;
  es_anulado: boolean;
  fecha_hora_anulacion: string | null;
  motivo_anulacion: string | null;
  evidencias_anulacion?: IArchivo[];
  cuenta_planta_numero: string | null;
  banco_planta_nombre: string | null;
  cuenta_empresa_numero: string | null;
  banco_empresa_nombre: string | null;
  empleado_registro_nombre: string | null;
  empleado_anulacion_nombre: string | null;
}

export interface RES_ComprobanteVenta {
  id: number;
  id_empresa: number;
  empresa_nombre?: string;
  empresa_ruc?: string;
  id_planta_destino: number;
  planta_nombre: string;
  planta_ruc: string | null;
  id_tipo_cambio: number;
  tipo_cambio_fecha: string;
  id_empleado_registro: number;
  id_empleado_anulacion: number | null;
  tipo_pago: TipoPagoComprobanteVenta;
  codigo_comprobante: string;
  codigo_completo: string;
  fecha_emision: string;
  evidencias?: IArchivo[];
  tipo_cambio_venta: number;
  percentaje_igv: number;
  porcentaje_detraccion: number;
  total_dolares_antes_descuento: number;
  total_soles_antes_descuento: number;
  descuento: number;
  total_dolares: number;
  total_soles: number;
  monto_igv_soles: number;
  monto_pagado_anticipos: number;
  monto_detraccion: number;
  monto_detraccion_soles: number;
  monto_neto: number;
  avance_pago_neto: number;
  avance_pago_detraccion: number;
  created_at: string;
  estado: EstadoComprobanteVenta;
  empleado_registro_nombre?: string | null;
  empleado_anulacion_nombre?: string | null;
  total_pagado_neto: number;
  total_pagado_detraccion: number;
  lotes_valorizados: RES_LoteValorizadoVenta[];
  transacciones_anticipo?: RES_TransaccionAnticipoPlanta[];
}

export interface RES_DetalleValorizacionDisponible {
  id: number;
  id_valorizacion_venta_detalle: number;
  id_valorizacion_venta: number;
  valorizacion_correlativo: string;
  valorizacion_codigo: string;
  fecha_hora_aprobacion: string;
  elemento_quimico: string;
  subtotal: number;
  precio_por_tonelada: number;
  lote_correlativo: string | null;
  codigo_preliminar: string | null;
  despacho_correlativo: string | null;
  blending_correlativo: string | null;
  codigo_cliente: string | null;
}
