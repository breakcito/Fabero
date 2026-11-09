/**
 * Catálogo 09 SUNAT — "Códigos de Tipo de Nota de Crédito Electrónica".
 * Espejo 1:1 de `App\Shared\Enums\ContabilidadCompra\MotivoNotaCreditoComprobante`.
 */
export enum MotivoNotaCreditoComprobante {
  AnulacionOperacion = "01",
  AnulacionErrorRuc = "02",
  CorreccionErrorDescripcion = "03",
  DescuentoGlobal = "04",
  DescuentoItem = "05",
  DevolucionTotal = "06",
  DevolucionItem = "07",
  Bonificacion = "08",
  DisminucionValor = "09",
  OtrosConceptos = "10",
  AjustesOperacionExportacion = "11",
  AjustesAfectosIvap = "12",
  CorreccionMontoNetoPendiente = "13",
}

export const MOTIVO_NOTA_CREDITO_DESCRIPCION: Record<
  MotivoNotaCreditoComprobante,
  string
> = {
  [MotivoNotaCreditoComprobante.AnulacionOperacion]:
    "Anulación de la operación",
  [MotivoNotaCreditoComprobante.AnulacionErrorRuc]:
    "Anulación por error en el RUC",
  [MotivoNotaCreditoComprobante.CorreccionErrorDescripcion]:
    "Corrección por error en la descripción",
  [MotivoNotaCreditoComprobante.DescuentoGlobal]: "Descuento global",
  [MotivoNotaCreditoComprobante.DescuentoItem]: "Descuento por ítem",
  [MotivoNotaCreditoComprobante.DevolucionTotal]: "Devolución total",
  [MotivoNotaCreditoComprobante.DevolucionItem]: "Devolución por ítem",
  [MotivoNotaCreditoComprobante.Bonificacion]: "Bonificación",
  [MotivoNotaCreditoComprobante.DisminucionValor]: "Disminución en el valor",
  [MotivoNotaCreditoComprobante.OtrosConceptos]: "Otros conceptos",
  [MotivoNotaCreditoComprobante.AjustesOperacionExportacion]:
    "Ajustes de operaciones de exportación",
  [MotivoNotaCreditoComprobante.AjustesAfectosIvap]: "Ajustes afectos al IVAP",
  [MotivoNotaCreditoComprobante.CorreccionMontoNetoPendiente]:
    "Corrección del monto neto pendiente de pago y/o fechas de vencimiento",
};

export const MOTIVO_NOTA_CREDITO_OPCIONES = Object.entries(
  MOTIVO_NOTA_CREDITO_DESCRIPCION,
).map(([value, label]) => ({ value, label }));
