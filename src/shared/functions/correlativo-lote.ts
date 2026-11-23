/**
 * Lógica del correlativo de un lote (creación y muestreo).
 *
 * El correlativo de un lote tiene dos componentes:
 * - el **correlativo** (texto): `26-FB-00005`.
 * - el **N° correlativo** (número de la secuencia): `5`.
 *
 * El `numero_correlativo` en NULL marca un código escrito a mano: no
 * pertenece a la secuencia oficial y se libera cuando el lote se elimina.
 *
 * El modo se elige con un check en la UI:
 * - **Manual**: el N° correlativo va en NULL y el correlativo se escribe a
 *   mano (solo el correlativo es editable).
 * - **Secuencia**: el correlativo va con la secuencia y lo que se ajusta es
 *   el N° correlativo (solo el N° es editable).
 */

/** Payload del correlativo al crear un lote. */
export interface IFlagsCorrelativo {
  correlativo?: string;
  numero_correlativo?: number;
}

/**
 * Reconstruye el correlativo conservando el año, el prefijo y el ancho de
 * ceros del correlativo base.
 *
 * @example 26-FB-00005 con el número 12 -> 26-FB-00012
 */
export const reconstruirCorrelativo = (
  correlativoBase: string,
  numero: number,
): string => {
  const partes = correlativoBase.split("-");
  if (partes.length < 2) return correlativoBase;

  const ultimo = partes[partes.length - 1];
  const digitos = /^\d+$/.test(ultimo) ? ultimo.length : 0;
  partes[partes.length - 1] =
    digitos > 0 ? String(numero).padStart(digitos, "0") : String(numero);

  return partes.join("-");
};

/**
 * Modo inicial del correlativo según el lote.
 *
 * El `numero_correlativo` en NULL es la marca de "código escrito a mano": el
 * modal de muestreo arranca en modo manual para no perder ese dato.
 */
export const modoCorrelativoInicial = (
  numeroCorrelativo: number | null,
): boolean => numeroCorrelativo === null;

/**
 * Payload del correlativo al CREAR un lote.
 *
 * - Manual: se envía solo el correlativo. El N° correlativo queda en NULL.
 * - Secuencia: si el N° se ajustó, el correlativo se recalcula y se envía con
 *   su número; si no se ajustó, no se envía nada (el backend usa el
 *   autogenerado).
 */
export const payloadCorrelativoLote = (params: {
  manual: boolean;
  correlativo: string;
  numeroCorrelativo: string;
  numeroCorrelativoAuto: string;
  correlativoAuto: string;
}): IFlagsCorrelativo => {
  if (params.manual) {
    const correlativo = params.correlativo.trim().toUpperCase();
    return correlativo ? { correlativo } : {};
  }

  const numero = Number(params.numeroCorrelativo);
  const numeroAuto = Number(params.numeroCorrelativoAuto);

  if (numero > 0 && numero !== numeroAuto) {
    return {
      correlativo: reconstruirCorrelativo(params.correlativoAuto, numero),
      numero_correlativo: numero,
    };
  }

  return {};
};

/**
 * Payload del correlativo al CONFIRMAR EL MUESTREO.
 *
 * El correlativo siempre se envía (es el que ya tiene el lote); el N°
 * correlativo va en NULL cuando el modo es manual.
 */
export const payloadCorrelativoMuestreo = (params: {
  manual: boolean;
  correlativo: string;
  numeroCorrelativo: string;
}): { correlativo: string; numero_correlativo: number | null } => {
  const numero = Number(params.numeroCorrelativo);

  return {
    correlativo: params.correlativo.trim().toUpperCase(),
    numero_correlativo: params.manual ? null : numero > 0 ? numero : null,
  };
};
