/**
 * Interfaces de respuesta del dashboard de indicadores.
 * Mapean 1:1 el payload de `GET /api/dashboard/resumen`.
 *
 * UNIDADES: todos los pesos de la base de datos están en KILOGRAMOS; la API
 * los convierte a toneladas (÷1000) antes de exponerlos. Los montos están en
 * dólares (USD) salvo `detraccion_usd`, que la API normaliza a USD con el
 * tipo de cambio vigente.
 */

/** Costos y leyes por elemento químico (`Oro` / `Plata`). */
export interface RES_DashboardElemento {
  Oro: number;
  Plata: number;
}

/** Costo promedio por tonelada (USD/t) de compra y de venta. */
export interface RES_DashboardCostos {
  compra: RES_DashboardElemento;
  venta: RES_DashboardElemento;
}

/**
 * Leyes promedio (g/t).
 * - `compra`: cierre de leyes del grupo de análisis (o la del lote).
 * - `venta_final`: la que calcula Fabero (`despacho_detalle`).
 * - `venta_cliente`: la que reporta la planta receptora (`distribucion_detalle`).
 */
export interface RES_DashboardLeyes {
  compra: RES_DashboardElemento;
  venta_final: RES_DashboardElemento;
  venta_cliente: RES_DashboardElemento;
}

/** Un mes dentro de la serie de evolución. */
export interface RES_DashboardMes {
  anio: number;
  /** 1-12 */
  mes: number;
  tn_receptadas: number;
  tn_despachadas: number;
  tn_compradas: number;
  tn_vendidas: number;
  monto_compra_usd: number;
  monto_venta_usd: number;
  /** Costo promedio ponderado por tonelada comprada (USD/t). */
  costo_compra_usd_t: number;
  /** Costo promedio ponderado por tonelada vendida (USD/t). */
  costo_venta_usd_t: number;
  costos: RES_DashboardCostos;
  leyes: RES_DashboardLeyes;
}

export interface RES_DashboardPeriodo {
  /** `YYYY-MM` del mes en curso (último de la ventana). */
  mes_actual: string;
  /** Últimos 12 meses, incluyendo el mes en curso (datos parciales). */
  meses: RES_DashboardMes[];
  /** Los mismos 12 meses del año anterior (comparativo interanual). */
  meses_anio_anterior: RES_DashboardMes[];
}

/** Contraparte con mayor saldo pendiente. */
export interface RES_DashboardContraparte {
  nombre: string;
  monto_usd: number;
}

/** Cuentas por pagar (compras) o por cobrar (ventas). */
export interface RES_DashboardCuenta {
  /** Saldo pendiente neto en USD. */
  neto_usd: number;
  /** Saldo pendiente de detracción, normalizado a USD. */
  detraccion_usd: number;
  /** neto + detracción. */
  total_usd: number;
  mayor_deudor?: RES_DashboardContraparte | null;
  mayor_acreedor?: RES_DashboardContraparte | null;
}

export interface RES_DashboardTipoCambio {
  fecha: string;
  valor_compra: number;
  valor_venta: number;
}

export interface RES_DashboardFinanciero {
  por_pagar: RES_DashboardCuenta;
  por_cobrar: RES_DashboardCuenta;
  tipo_cambio: RES_DashboardTipoCambio | null;
}

/** Componentes del stock en cancha, en TMH y TMS. */
export interface RES_DashboardStock {
  tmh: number;
  tms: number;
}

export interface RES_DashboardCancha {
  stock: {
    lotes: RES_DashboardStock;
    blendings: RES_DashboardStock;
    por_salir: RES_DashboardStock;
  };
  /** Días promedio entre la recepción y el despacho. */
  dias: {
    todo: number;
    blending: number;
    directo: number;
  };
}

/** Valorización aprobada sin comprobante registrado. */
export interface RES_DashboardSinComprobante {
  conteo: number;
  monto_usd: number;
}

export interface RES_DashboardSinComprobanteDetalle {
  /** `C` = compras, `V` = ventas. */
  tipo: "C" | "V";
  documento: string;
  contraparte: string;
  dias: number;
  monto_usd: number;
}

export interface RES_DashboardSinComprobanteBloque {
  compras: RES_DashboardSinComprobante;
  ventas: RES_DashboardSinComprobante;
  detalle: RES_DashboardSinComprobanteDetalle[];
}

export interface RES_Dashboard {
  periodo: RES_DashboardPeriodo;
  financiero: RES_DashboardFinanciero;
  cancha: RES_DashboardCancha;
  sin_comprobante: RES_DashboardSinComprobanteBloque;
}
