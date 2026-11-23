/**
 * Conversión entre el decimal que viaja por el API (y se guarda en la BD) y el
 * porcentaje que captura y muestra el operador.
 *
 * El contrato con la API SIEMPRE es decimal: el operador escribe `6` (6%) y
 * el sistema guarda `0.06`. La conversión vive en la frontera de la UI:
 * se muestra en % y se convierte a decimal al enviar.
 */
export const decimalAPorcentaje = (v: number | null | undefined): number | null =>
  v === null || v === undefined ? null : v * 100;

export const porcentajeADecimal = (v: number | null | undefined): number | null =>
  v === null || v === undefined ? null : v / 100;

/**
 * Porcentaje redondeado, listo para mostrar en un input o en una tabla.
 * Evita el ruido de coma flotante al multiplicar por 100 (0.06 -> 6.000000001).
 */
export const decimalAPorcentajeRedondeado = (
  v: number | null | undefined,
  decimales: number = 2,
): number | null => {
  const porcentaje = decimalAPorcentaje(v);
  if (porcentaje === null || Number.isNaN(porcentaje)) return null;
  const factor = 10 ** decimales;
  return Math.round(porcentaje * factor) / factor;
};

/**
 * Formatea un decimal (BD) como porcentaje legible: 0.06 -> "6.00".
 */
export const formatDecimalAPorcentaje = (
  v: number | null | undefined,
  decimales: number = 2,
): string => {
  const porcentaje = decimalAPorcentaje(v);
  if (porcentaje === null || Number.isNaN(porcentaje)) return "0";
  return porcentaje.toFixed(decimales);
};
