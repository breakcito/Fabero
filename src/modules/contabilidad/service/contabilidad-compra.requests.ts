import { z } from "zod";
import type { MedioPagoComprobante } from "../../../shared/enums/contabilidad-compra/medio-pago-comprobante";
import type { TipoAprobacionComprobante } from "../../../shared/enums/contabilidad-compra/tipo-aprobacion-comprobante";
import type { TipoNotaComprobante } from "../../../shared/enums/contabilidad-compra/tipo-nota-comprobante";

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
  es_al_contado?: boolean;
  es_al_credito?: boolean;
  plazo_credito?: number | null;
  plazo_credito_periodo?: string | null;
  total_cuotas?: number | null;
  metodo_pago?: string;
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

/**
 * Nota de crédito / débito sobre un comprobante de compra.
 * El monto se registra en USD (moneda operativa del comprobante).
 */
export const Schema_RegistrarNotaComprobante = z.object({
  tipo: z.enum(["Credito", "Debito"], {
    error: "Seleccione el tipo de nota",
  }),
  monto: z
    .number({ error: "Ingrese el monto de la nota" })
    .positive("El monto debe ser mayor a 0")
    .max(9_999_999.99, "El monto es demasiado grande"),
  codigo_nota: z
    .string()
    .max(50, "El código es demasiado largo")
    .optional()
    .or(z.literal("")),
  motivo: z
    .string({ error: "Seleccione el motivo SUNAT" })
    .min(1, "Seleccione el motivo SUNAT"),
  fecha_emision: z
    .string({ error: "Ingrese la fecha de emisión" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD"),
});

export type REQ_RegistrarNotaComprobante = Omit<
  z.infer<typeof Schema_RegistrarNotaComprobante>,
  "tipo"
> & {
  tipo: TipoNotaComprobante;
  documentos?: File[];
};

export interface REQ_AnularNotaComprobante {
  motivo: string;
}