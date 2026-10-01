import { z } from "zod";
import { TipoPagoValorizacionCompra } from "../../../shared/enums/valorizacion-compra/tipo-pago-valorizacion-compra";
import { ElementoQuimicoValorizacion } from "../../../shared/enums/_generic/elemento-quimico-valorizacion";
import type { IArchivo } from "../../../shared/interfaces/archivo";

export const Schema_ValorizacionDetalleItem = z.object({
  id_lote_guia: z.number().int().positive("Debe seleccionar un lote válido"),
  elemento_quimico: z.nativeEnum(ElementoQuimicoValorizacion),
  id_condicion_comercial: z.number().int().positive().nullable().optional(),
  id_valor_elemento_quimico: z.number().int().positive().nullable().optional(),
  inter: z.number().min(0, "El valor internacional debe ser mayor o igual a 0"),
  des_inter: z.number().min(0, "El descuento debe ser mayor o igual a 0"),
  recuperacion: z.number().min(0, "La recuperación debe ser mayor o igual a 0"),
  maquila: z.number().min(0, "La maquila debe ser mayor o igual a 0"),
  consumo: z.number().min(0, "El consumo debe ser mayor o igual a 0"),
  factor: z.number().optional(),
});

export const Schema_ValorizacionAnticipoItem = z.object({
  id_anticipo_proveedor: z.number().int().positive("Anticipo inválido"),
  monto_retirado: z.number().positive("El monto retirado debe ser mayor a 0"),
  factura: z.string().optional(),
});

export const Schema_CrearValorizacion = z.object({
  id_proveedor_minero: z.number().int().positive("Seleccione un proveedor"),
  id_concesion: z.number().int().positive("Seleccione una concesión"),
  id_cuenta_bancaria: z.number().int().positive().nullable().optional(),
  id_cuenta_detraccion: z.number().int().positive().nullable().optional(),
  tipo_pago: z.nativeEnum(TipoPagoValorizacionCompra),
  detalles: z.array(Schema_ValorizacionDetalleItem).min(1, "Debe agregar al menos un lote"),
  anticipos: z.array(Schema_ValorizacionAnticipoItem).optional(),
  evidencias: z.array(z.instanceof(File)).optional(),
  fecha_hora_valorizacion: z.string().nullable().optional(),
  monto_penalidad: z.number().min(0).optional(),
  monto_flete: z.number().min(0).optional(),
});

export const Schema_EditarValorizacion = z.object({
  id_concesion: z.number().int().positive("Seleccione una concesión"),
  id_cuenta_bancaria: z.number().int().positive().nullable().optional(),
  id_cuenta_detraccion: z.number().int().positive().nullable().optional(),
  tipo_pago: z.nativeEnum(TipoPagoValorizacionCompra),
  detalles: z.array(Schema_ValorizacionDetalleItem).min(1, "Debe agregar al menos un lote"),
  anticipos: z.array(Schema_ValorizacionAnticipoItem).optional(),
  evidencias: z.array(z.instanceof(File)).optional(),
  evidencias_existentes: z.array(z.any()).optional(),
  motivo_edicion: z.string().min(3, "Ingrese un motivo de edición").optional(),
  fecha_hora_valorizacion: z.string().nullable().optional(),
  monto_penalidad: z.number().min(0).optional(),
  monto_flete: z.number().min(0).optional(),
});

export const Schema_AnularValorizacion = z.object({
  motivo_anulacion: z.string().min(5, "El motivo de anulación debe tener al menos 5 caracteres"),
  tipo_eliminacion: z.enum(["logica", "fisica"]),
  evidencias_anulacion: z.array(z.instanceof(File)).optional(),
});

export interface REQ_FiltroValorizaciones {
  id_proveedor?: number;
}

export interface REQ_ValorizacionDetalleItem {
  id_lote_guia: number;
  elemento_quimico: ElementoQuimicoValorizacion;
  id_condicion_comercial?: number | null;
  id_valor_elemento_quimico?: number | null;
  inter: number;
  des_inter: number;
  recuperacion: number;
  maquila: number;
  consumo: number;
  factor?: number;
}

export interface REQ_ValorizacionAnticipoItem {
  id_anticipo_proveedor: number;
  monto_retirado: number;
  factura?: string;
}

export interface REQ_CrearValorizacion {
  id_proveedor_minero: number;
  id_concesion: number;
  id_cuenta_bancaria?: number | null;
  id_cuenta_detraccion?: number | null;
  tipo_pago: TipoPagoValorizacionCompra;
  detalles: REQ_ValorizacionDetalleItem[];
  anticipos?: REQ_ValorizacionAnticipoItem[];
  evidencias?: File[];
  fecha_hora_valorizacion?: string | null;
  monto_penalidad?: number;
  monto_flete?: number;
}

export interface REQ_EditarValorizacion {
  id_concesion: number;
  id_cuenta_bancaria?: number | null;
  id_cuenta_detraccion?: number | null;
  tipo_pago: TipoPagoValorizacionCompra;
  detalles: REQ_ValorizacionDetalleItem[];
  anticipos?: REQ_ValorizacionAnticipoItem[];
  evidencias?: File[];
  evidencias_existentes?: IArchivo[];
  motivo_edicion?: string;
  fecha_hora_valorizacion?: string | null;
  monto_penalidad?: number;
  monto_flete?: number;
}

export interface REQ_AnularValorizacion {
  motivo_anulacion: string;
  tipo_eliminacion: "logica" | "fisica";
  evidencias_anulacion?: File[];
}
