/**
 * Tipo de nota de crédito / débito sobre un comprobante de compra.
 * Espejo 1:1 de `App\Shared\Enums\ContabilidadCompra\TipoNotaComprobante`.
 */
export enum TipoNotaComprobante {
  Credito = "Credito",
  Debito = "Debito",
}

export const TIPO_NOTA_DESCRIPCION: Record<TipoNotaComprobante, string> = {
  [TipoNotaComprobante.Credito]: "Nota de Crédito",
  [TipoNotaComprobante.Debito]: "Nota de Débito",
};

/** Signo que aplica la nota sobre el monto neto del comprobante. */
export const TIPO_NOTA_SIGNO: Record<TipoNotaComprobante, 1 | -1> = {
  [TipoNotaComprobante.Credito]: -1,
  [TipoNotaComprobante.Debito]: 1,
};

/** Series SUNAT típicas para el tipo de nota (referencia, no validación). */
export const TIPO_NOTA_SERIES_REFERENCIA: Record<TipoNotaComprobante, string> = {
  [TipoNotaComprobante.Credito]: "FC01, FC02, FC03, FC04",
  [TipoNotaComprobante.Debito]: "FD01, FD02, FD03",
};

/** Color Mantine v8 sugerido para cada tipo de nota. */
export const TIPO_NOTA_COLOR: Record<TipoNotaComprobante, string> = {
  [TipoNotaComprobante.Credito]: "teal",
  [TipoNotaComprobante.Debito]: "orange",
};
