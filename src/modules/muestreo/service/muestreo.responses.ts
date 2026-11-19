import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";

/**
 * Partición activa de un lote, listada dentro del modal de confirmación de
 * muestreo. Se confirman junto con el lote padre.
 */
export interface RES_ParticionMuestreo {
  id: number;
  id_lote_mineral: number;
  particion: string;
  correlativo: string;
  peso_inicial: number | null;
  peso_neto: number | null;
  estado: EstadoBase | string;
  con_codigo_temporal: boolean;
  muestreo_confirmado: boolean;
}

/**
 * Lote pendiente de muestreo.
 *
 * Entra al módulo cuando su correlativo es temporal (`con_codigo_temporal`)
 * o cuando todavía no se le confirmó el muestreo (`muestreo_confirmado`).
 */
export interface RES_LoteMuestreo {
  id: number;
  correlativo: string;
  numero_correlativo: number | null;
  tipo_producto: string | null;
  tipo_mineral: string | null;
  con_codigo_temporal: boolean;
  muestreo_confirmado: boolean;
  peso_inicial: number | null;
  peso_final: number | null;
  peso_neto: number | null;
  estado: EstadoBase | string;
  tiene_particion: boolean;
  particionado_desde_balanza: boolean;
  id_recepcion_unidad: number | null;
  id_proveedor_minero: number | null;
  id_zona_origen: number | null;
  created_at: string;
  fecha_hora_ingreso: string | null;
  tipo_ingreso: string | null;
  vehiculo_placa: string | null;
  proveedor_razon_social: string | null;
  zona_origen_nombre: string | null;
  particiones: RES_ParticionMuestreo[];
  total_particiones: number;
  particiones_pendientes: number;
}
