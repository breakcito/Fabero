/**
 * Catálogo 10 SUNAT — "Códigos de Tipo de Nota de Débito Electrónica".
 * Espejo 1:1 de `App\Shared\Enums\ContabilidadCompra\MotivoNotaDebitoComprobante`.
 */
export enum MotivoNotaDebitoComprobante {
  InteresesMora = "01",
  AumentoValor = "02",
  PenalidadesOtrosConceptos = "03",
  AjustesOperacionExportacion = "11",
  AjustesAfectosIvap = "12",
}

export const MOTIVO_NOTA_DEBITO_DESCRIPCION: Record<
  MotivoNotaDebitoComprobante,
  string
> = {
  [MotivoNotaDebitoComprobante.InteresesMora]: "Intereses por mora",
  [MotivoNotaDebitoComprobante.AumentoValor]: "Aumento en el valor",
  [MotivoNotaDebitoComprobante.PenalidadesOtrosConceptos]:
    "Penalidades / otros conceptos",
  [MotivoNotaDebitoComprobante.AjustesOperacionExportacion]:
    "Ajustes de operaciones de exportación",
  [MotivoNotaDebitoComprobante.AjustesAfectosIvap]: "Ajustes afectos al IVAP",
};

export const MOTIVO_NOTA_DEBITO_OPCIONES = Object.entries(
  MOTIVO_NOTA_DEBITO_DESCRIPCION,
).map(([value, label]) => ({ value, label }));
