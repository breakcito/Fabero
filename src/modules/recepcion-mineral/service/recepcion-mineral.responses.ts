import type { RES_CambiosLog } from "../../../service/responses/_generic/cambios-log";
import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type { IDocumentoProgramacion } from "../../../shared/interfaces/documentos-programacion";
import type { DistribucionDetalleItem } from "../../programacion-despachos/service/programacion-despachos.responses";
import type { IArchivo } from "../../../shared/interfaces/archivo";

export interface RES_LoteMineral {
  id: number;
  id_recepcion_unidad: number | null;
  id_empresa?: number | null;
  empresa_nombre?: string;
  id_proveedor_minero: number | null;
  proveedor_nombre?: string;
  proveedor_telefono?: string;
  id_proveedor_minero_recepcion: number | null;
  proveedor_nombre_recepcion?: string;
  id_empleado_registro: number;
  empleado_registro_nombre?: string;
  id_zona_origen: number | null;
  zona_origen_nombre?: string;
  correlativo: string;
  numero_correlativo: number | null;
  con_codigo_manual: boolean;
  numero_contacto: string | null;
  tipo_producto: string | null;
  tipo_mineral: string | null;
  condicion_ingreso: string | null;
  estado?: EstadoBase | string;
  log_cambios?: RES_CambiosLog[] | null;
  evidencias: IArchivo[] | null;
  peso_inicial: number | null;
  fecha_hora_peso_inicial: string | null;
  observacion_peso_inicial: string | null;
  peso_final: number | null;
  fecha_hora_peso_final: string | null;
  observacion_peso_final: string | null;
  peso_neto: number | null;
  peso_actual: number | null;
  id_vehiculo: number | null;
  vehiculo_placa: string | null;
  id_empresa_transporte: number | null;
  empresa_transporte_razon_social: string | null;
  id_tipo_vehiculo: number | null;
  tipo_vehiculo_nombre: string | null;
  id_conductor: number | null;
  conductor_nombre_completo: string | null;
  conductor_dni: string | null;
  created_at: string;
  // Balanza-particion fields
  particionado_desde_balanza?: boolean;
  particion_finalizada?: boolean;
  id_empleado_fin_particion?: number | null;
  fecha_hora_fin_particion?: string | null;
  tiene_particiones?: boolean;
}

/**
 * Partición creada desde Balanza Recepción. A diferencia de las particiones
 * de Validación y Distribución, estas tienen una `id_recepcion_unidad` REAL
 * (no ficticia) y se crean sin ticket (se genera al primer pesaje).
 *
 * El backend hidrata los campos heredados del lote padre (`id_proveedor_minero`,
 * `id_zona_origen`, `numero_contacto`, `tipo_producto`, `tipo_mineral`, `lote_correlativo`)
 * para que la UI los muestre sin un fetch extra.
 */
export interface RES_ParticionBalanza {
  id: number;
  id_lote_mineral: number;
  id_ticket_balanza: number | null;
  ticket_correlativo: string | null;
  id_recepcion_unidad: number | null;
  recepcion_estado_pesaje?: string | null;
  vehiculo_placa?: string | null;
  correlativo: string;
  particion: string;
  peso_inicial: number | null;
  fecha_hora_peso_inicial: string | null;
  peso_final: number | null;
  fecha_hora_peso_final: string | null;
  peso_neto: number | null;
  estado: EstadoBase | string;
  es_bloqueado: boolean;
  esta_validado: boolean;
  evidencias: IArchivo[] | null;
  // Campos heredados del lote padre (hidratados por backend)
  id_proveedor_minero?: number | null;
  proveedor_nombre?: string | null;
  id_zona_origen?: number | null;
  zona_origen_nombre?: string | null;
  numero_contacto?: string | null;
  tipo_producto?: string | null;
  tipo_mineral?: string | null;
  lote_correlativo?: string | null;
}

/**
 * Unión discriminada para el grid unificado de "Lotes" en `card-proceso-balanza`.
 * El operador ve un solo grid que mezcla lotes regulares y particiones (de un lote
 * padre particionado desde Balanza) — la diferencia visual es el sufijo "-A" en
 * el correlativo y un badge con la letra de la partición.
 */
export type LoteOParticionEnUnidad =
  | { tipo: "LOTE"; lote: RES_LoteMineral }
  | { tipo: "PARTICION"; particion: RES_ParticionBalanza };

/**
 * Lote padre particionado desde Balanza con sus métricas de particiones activas,
 * para alimentar el header global de la pantalla de Balanza Recepción.
 */
export interface RES_LotePadreParticionado {
  id: number;
  correlativo: string;
  numero_correlativo: number | null;
  id_empresa: number | null;
  particionado_desde_balanza: number | boolean;
  particion_finalizada: number | boolean;
  id_empleado_fin_particion: number | null;
  fecha_hora_fin_particion: string | null;
  tipo_producto: string | null;
  tipo_mineral: string | null;
  condicion_ingreso: string | null;
  tiene_particion: number | boolean;
  total_particiones: number;
  particiones_sin_peso_final: number;
}

export interface RecepcionMineralResponse {
  id: number;
  id_empleado_registro: number;
  empleado_registro_nombre: string;
  id_vehiculo: number | null;
  vehiculo_placa: string | null;
  id_vehiculo_carreta: number | null;
  vehiculo_carreta_placa: string | null;
  id_empresa_transporte: number | null;
  empresa_transporte_razon_social: string | null;
  id_tipo_vehiculo: number | null;
  tipo_vehiculo_nombre: string | null;
  id_conductor: number | null;
  conductor_nombre_completo: string | null;
  conductor_dni: string | null;
  tipo_ingreso: string;
  fecha_hora_ingreso: string;
  fecha_hora_salida: string | null;
  fecha_hora_inicio_pesaje: string | null;
  fecha_hora_final_pesaje: string | null;
  evidencias: IArchivo[] | null;
  observacion: string | null;
  estado: string;
  estado_salida: string | null;
  estado_pesaje: string | null;
  es_programacion: number;
  id_sucursal: number | null;
  id_distribucion: number | null;
  lotes: RES_LoteMineral[];
  distribucion_detalles: DistribucionDetalleItem[];
  documentos_programacion: IDocumentoProgramacion | null;
  log_cambios?: RES_CambiosLog[] | null;
  /**
   * Proveedor denormalizado desde `recepcion_unidad.id_proveedor_minero`. Se usa
   * como fuente principal del autocomplete de proveedor al pesar una PARTICIÓN
   * (cascada: unidad → lote padre → vacío). Viene del backend en
   * `get_recepciones_mineral` vía `LEFT JOIN proveedor`.
   */
  id_proveedor_minero: number | null;
  proveedor_nombre_recepcion_unidad?: string;
}
