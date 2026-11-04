/** Formateadores del dashboard. */

/** Abreviaturas de mes en español (eje X de los gráficos). */
export const MESES_CORTOS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

/** Número con separador de miles y decimales fijos. */
export const fmt = (n: number, d = 0): string => {
  const valor = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(valor);
};

/** Monto compacto en dólares: $1.25M / $153k / $842. */
export const usd = (v: number): string => {
  const valor = Number.isFinite(v) ? v : 0;
  const abs = Math.abs(valor);
  if (abs >= 1e6) return `$${(valor / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${Math.round(valor / 1e3)}k`;
  return `$${fmt(valor)}`;
};

/** Etiqueta de un mes: "Oct 2026". */
export const etiquetaMes = (anio: number, mes: number): string =>
  `${MESES_CORTOS[mes - 1] ?? ""} ${anio}`;

/** Variación porcentual entre dos valores (0 si la base no es válida). */
export const variacion = (actual: number, base: number): number => {
  if (!Number.isFinite(base) || base === 0) return 0;
  return ((actual - base) / Math.abs(base)) * 100;
};
