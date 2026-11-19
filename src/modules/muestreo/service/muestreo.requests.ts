/**
 * Payload para confirmar el muestreo de un lote.
 *
 * El correlativo y el N° correlativo llegan precargados con los valores
 * actuales del lote y son editables: si se cambian, el correlativo queda
 * consolidado (deja de ser temporal).
 */
export interface DTO_ConfirmarMuestreo {
  tipo_producto: string;
  tipo_mineral: string;
  correlativo: string;
  numero_correlativo?: number | null;
  /** Id de la partición a confirmar (null = el propio lote). */
  id_particion?: number | null;
}

/** Filtros del listado de lotes pendientes de muestreo. */
export interface FiltrosMuestreo {
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}
