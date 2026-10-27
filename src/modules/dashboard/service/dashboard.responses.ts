/**
 * Interfaces de respuesta del dashboard de indicadores.
 * Mapean 1:1 el payload de `GET /api/dashboard/indicadores`.
 */

/**
 * Indicadores del dashboard.
 *
 * UNIDADES: todos los pesos de la base de datos están en KILOGRAMOS.
 * El API los convierte a toneladas (÷1000) antes de exponerlos, por eso
 * los campos que llevan "toneladas" o "_t" ya están en toneladas.
 */
export interface RES_DashboardKpis {
  /** Toneladas (t) recepcionadas en el período. */
  toneladas_receptadas: number;
  lotes_receptados: number;
  /**
   * Leyes promedio ponderadas por peso de los lotes con valorización APROBADA.
   * La ley se consolida en `lote_mineral` al aprobar la valorización, por eso
   * estos indicadores siguen en 0 mientras no haya valorizaciones aprobadas.
   */
  ley_oro_prom: number;
  ley_plata_prom: number;
  ley_humedad_prom: number;
  /** Lotes del período con valorización aprobada (base de las leyes). */
  lotes_aprobados: number;
  /** Valorización de compra en USD. */
  valorizacion_compra_usd: number;
  /** Precio por tonelada (USD/t) del mineral valorizado. */
  valor_por_tonelada_usd: number;
  /** Valorización de venta en USD. */
  valorizacion_venta_usd: number;
  /** Toneladas (t) despachadas. */
  toneladas_despachadas: number;
  despachos: number;
  lotes_validados: number;
  lotes_analizados: number;
  lotes_con_cierre_leyes: number;
  lotes_con_valor_comercial: number;
  lotes_valorizados: number;
  lotes_despachados: number;
}

export interface RES_DashboardSerie {
  fecha: string;
  toneladas: number;
  lotes: number;
  ley_oro: number;
  ley_plata: number;
  ley_humedad: number;
  valor_compra_usd: number;
  valor_venta_usd: number;
  toneladas_despachadas: number;
}

export interface RES_DashboardEmbudo {
  etapa: string;
  conteo: number;
  porcentaje: number;
}

export interface RES_DashboardProveedor {
  razon_social: string;
  valor_usd: number;
  toneladas: number;
}

export interface RES_DashboardElemento {
  elemento: string;
  valor_usd: number;
}

export interface RES_DashboardEstadoLote {
  estado: string;
  lotes: number;
  toneladas: number;
}

export interface RES_DashboardEstadoValorizacion {
  estado: string;
  conteo: number;
  valor_usd: number;
}

export interface RES_DashboardMerma {
  correlativo: string;
  guia_remitente: string | null;
  /** Toneladas declaradas en la guía de remisión. */
  peso_declarado_t: number;
  /** Toneladas realmente pesadas en balanza. */
  peso_real_t: number;
  merma_pct: number;
}

export interface RES_DashboardNoConformidad {
  guias_total: number;
  guias_no_conformidad: number;
  porcentaje: number;
}

export interface RES_DashboardTiempos {
  ingreso_a_pesaje_h: number | null;
  pesaje_a_analisis_h: number | null;
}

export interface RES_DashboardOperativo {
  unidades_en_planta: number;
  visitas_abiertas: number;
  guias_activas: number;
  lotes_sin_validar: number;
  valorizaciones_pendientes: number;
}

export interface RES_DashboardFinanciero {
  saldo_anticipos_pen: number;
  deuda_proveedores_pen: number;
  comprobantes_emitidos: number;
}

export interface RES_DashboardTipoCambio {
  fecha: string;
  valor_compra: number;
  valor_venta: number;
}

export interface RES_DashboardMeta {
  fecha_inicio: string;
  fecha_fin: string;
  id_sucursal: number | null;
  monedas: {
    valorizacion: string;
    financiero: string;
  };
}

export interface RES_Dashboard {
  kpis: RES_DashboardKpis;
  serie: RES_DashboardSerie[];
  embudo: RES_DashboardEmbudo[];
  por_proveedor: RES_DashboardProveedor[];
  por_elemento: RES_DashboardElemento[];
  por_estado_lote: RES_DashboardEstadoLote[];
  estado_valorizaciones: RES_DashboardEstadoValorizacion[];
  merma: RES_DashboardMerma[];
  no_conformidad: RES_DashboardNoConformidad;
  tiempos: RES_DashboardTiempos;
  operativo: RES_DashboardOperativo;
  financiero: RES_DashboardFinanciero;
  tipo_cambio: RES_DashboardTipoCambio;
  meta: RES_DashboardMeta;
}
