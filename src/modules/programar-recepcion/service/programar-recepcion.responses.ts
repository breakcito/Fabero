import type { IArchivo } from "../../../shared/interfaces/archivo";
import type { IDocumentoProgramacion } from "../../../shared/interfaces/documentos-programacion";
import type {
  IGuiaRecepcion,
  IProveedorRecepcion,
} from "../../../shared/interfaces/guia-recepcion";
import type { RES_CambiosLog } from "../../../service/responses/_generic/cambios-log";
import type { TipoIngreso } from "../../../shared/enums/_generic/tipo-ingreso";
import type { EstadoSalida } from "../../../shared/enums/_generic/estado-salida";

export interface ProgramacionListItem {
  id: number;
  id_empleado_autoriza: number | null;
  empleado_autoriza_nombre: string | null;
  id_empresa_transporte: number;
  empresa_transporte_razon_social: string;
  id_vehiculo: number | null;
  vehiculo_placa: string | null;
  id_tipo_vehiculo: number | null;
  tipo_vehiculo_nombre: string | null;
  id_conductor: number | null;
  conductor_nombre_completo: string | null;
  conductor_numero_licencia: string | null;
  tipo_ingreso: TipoIngreso | string | null;
  /** Guías por proveedor de la carga (modelo nuevo). */
  guias: IGuiaRecepcion[];
  /** Proveedores de la carga (modelo nuevo). */
  proveedores: IProveedorRecepcion[];
  /**
   * @deprecated Derivado del proveedor principal: usar `proveedores`.
   */
  id_proveedor_minero: number | null;
  /**
   * @deprecated Derivado del proveedor principal: usar `proveedores`.
   */
  proveedor_razon_social: string | null;
  /**
   * @deprecated Derivado de la guía principal: usar `guias`.
   */
  guia_remitente: string | null;
  /**
   * @deprecated Derivado de la guía principal: usar `guias`.
   */
  guia_transportista: string | null;
  /**
   * @deprecated La columna `documentos_programacion` fue eliminada: los
   *             archivos por proveedor están en `guias`.
   */
  documentos_programacion: IDocumentoProgramacion | null;
  fecha_estimada_llegada: string | null;
  observacion: string | null;
  es_programacion: boolean;
  id_empleado_recepcion: number | null;
  fecha_hora_ingreso: string | null;
  estado: string | null;
  /** Ticket de ingreso vehicular (se genera al confirmar la llegada). */
  id_ticket_recepcion_unidades: number | null;
  ticket_correlativo: string | null;
  ticket_numero_correlativo: number | null;
  created_at: string | null;
}

export interface ProgramacionVisitaPayload {
  id_recepcion_visita: number;
  id_motivo_ingreso: number | null;
  motivo_ingreso_nombre: string | null;
  fecha_hora_ingreso: string | null;
  observacion: string | null;
  estado: string | null;
  vehiculos?: ProgramacionVisitaVehiculo[];
  detalles?: ProgramacionVisitaDetalle[];
}

export interface ProgramacionVisitaVehiculo {
  id: number;
  id_recepcion_visita: number;
  placa: string;
  cantidad_personas: number;
  url_foto: string[] | null;
}

export interface ProgramacionVisitaDetalle {
  id_detalle: number;
  id_visitante: number;
  id_visita_vehiculo: number | null;
  es_conductor: boolean;
  estado: string;
  visitante_nombre: string;
  visitante_apellido: string | null;
  visitante_dni: string | null;
  visitante_telefono: string | null;
  url_foto_documento: string[] | null;
}

export interface ProgramacionDetail {
  id: number;
  id_empleado_registro: number;
  empleado_registro_nombre: string | null;
  id_vehiculo: number | null;
  vehiculo_placa: string | null;
  id_empresa_transporte: number;
  empresa_transporte_razon_social: string;
  id_tipo_vehiculo: number | null;
  tipo_vehiculo_nombre: string | null;
  id_conductor: number | null;
  conductor_nombre_completo: string | null;
  conductor_dni: string | null;
  conductor_numero_licencia: string | null;
  tipo_ingreso: TipoIngreso | string | null;
  id_vehiculo_carreta: number | null;
  vehiculo_carreta_placa: string | null;
  fecha_hora_ingreso: string | null;
  evidencias: IArchivo[];
  observacion: string | null;
  estado: string | null;
  estado_salida: string | null;
  fecha_hora_salida: string | null;
  observacion_salida: string | null;
  id_sucursal: number | null;
  fecha_hora_inicio_pesaje: string | null;
  fecha_hora_final_pesaje: string | null;
  estado_pesaje: string | null;
  id_empleado_autoriza: number | null;
  empleado_autoriza_nombre: string | null;
  id_empleado_recepcion: number | null;
  empleado_recepcion_nombre: string | null;
  es_programacion: boolean;
  fecha_estimada_llegada: string | null;
  /** Guías por proveedor de la carga (modelo nuevo). */
  guias: IGuiaRecepcion[];
  /**
   * Estado de la unidad al ingresar a planta: "Con Carga" o "Vacío".
   */
  estado_ingreso: EstadoSalida | string | null;
  /** Guías de SALIDA (mismo contrato que `guias`). */
  guias_salida: IGuiaRecepcion[];
  /** Proveedores de la carga (modelo nuevo). */
  proveedores: IProveedorRecepcion[];
  /**
   * @deprecated Derivado del proveedor principal: usar `proveedores`.
   */
  id_proveedor_minero: number | null;
  /**
   * @deprecated Derivado del proveedor principal: usar `proveedores`.
   */
  proveedor_razon_social: string | null;
  /**
   * @deprecated Derivado de la guía principal: usar `guias`.
   */
  guia_remitente: string | null;
  /**
   * @deprecated Derivado de la guía principal: usar `guias`.
   */
  guia_transportista: string | null;
  /**
   * @deprecated La columna `documentos_programacion` fue eliminada: los
   *             archivos por proveedor están en `guias`.
   */
  documentos_programacion: IDocumentoProgramacion | null;
  es_recepcion_ficticia: boolean;
  /** Ticket de ingreso vehicular (se genera al confirmar la llegada). */
  id_ticket_recepcion_unidades?: number | null;
  ticket_correlativo?: string | null;
  ticket_numero_correlativo?: number | null;
  /** Campos registrados en la programación: no editables. */
  campos_bloqueados?: string[];
  visita?: ProgramacionVisitaPayload | null;
  log_cambios?: RES_CambiosLog[] | null;
}
