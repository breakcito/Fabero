import type { RES_DashboardTipoCambio } from "../../service/dashboard.responses";

export type MonedaDashboard = "USD" | "PEN";

export interface IValorConvertido {
  valor: number;
  moneda: MonedaDashboard;
  /** true cuando el valor se convirtió con el tipo de cambio vigente. */
  convertido: boolean;
  /** Tipo de cambio aplicado (para rotular la cifra como convertida). */
  tc?: number;
}

/**
 * Convierte un monto entre USD y PEN usando el tipo de cambio vigente.
 *
 * USD -> PEN usa `valor_venta` (el banco vende dólares a ese tipo).
 * PEN -> USD usa `valor_compra` (el banco compra dólares a ese tipo).
 *
 * Si no hay tipo de cambio vigente, el monto se devuelve sin convertir
 * en su moneda nativa para no inventar una cifra.
 */
export const convertirMoneda = (
  valor: number,
  monedaNativa: MonedaDashboard,
  monedaObjetivo: MonedaDashboard,
  tipoCambio: RES_DashboardTipoCambio | null,
): IValorConvertido => {
  const seguro = Number.isFinite(valor) ? valor : 0;

  if (monedaNativa === monedaObjetivo || !tipoCambio) {
    return { valor: seguro, moneda: monedaNativa, convertido: false };
  }

  if (monedaNativa === "USD" && monedaObjetivo === "PEN") {
    const tc = Number(tipoCambio.valor_venta);
    if (!Number.isFinite(tc) || tc <= 0) {
      return { valor: seguro, moneda: monedaNativa, convertido: false };
    }
    return { valor: seguro * tc, moneda: "PEN", convertido: true, tc };
  }

  const tc = Number(tipoCambio.valor_compra);
  if (!Number.isFinite(tc) || tc <= 0) {
    return { valor: seguro, moneda: monedaNativa, convertido: false };
  }
  return { valor: seguro / tc, moneda: "USD", convertido: true, tc };
};

/** Símbolo de la moneda para los rótulos. */
export const simboloMoneda = (moneda: MonedaDashboard): string =>
  moneda === "USD" ? "$" : "S/";
