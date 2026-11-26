import type { IArchivo } from "../../../shared/interfaces/archivo";
import type { IGuiaRecepcion } from "../../../shared/interfaces/guia-recepcion";
import type { TipoIngreso } from "../../../shared/enums/_generic/tipo-ingreso";
import type { EstadoSalida } from "../../../shared/enums/_generic/estado-salida";

/**
 * Registro de salida de una unidad.
 *
 * Las guías de salida tienen el mismo contrato que las de ingreso (una
 * entrada por proveedor) y se guardan en `recepcion_unidad.guias_salida`.
 */
export interface DTO_RegistrarSalida {
  estado_salida: EstadoSalida | string;
  observacion_salida?: string;
  guias_salida?: IGuiaRecepcion[];
  /** Archivos nuevos de las guías de salida, indexados por proveedor. */
  guias_archivos?: Record<
    number,
    { guia_remitente?: File; guia_transportista?: File }
  >;
  evidencias?: File[];
}

export interface DTO_EditarObservacionEvidencias {
  observacion?: string | null;
  observacion_salida?: string | null;
  motivo?: string | null;
  evidencias_existentes?: IArchivo[];
  evidencias?: File[];
}

/**
 * Edición de campos puntuales de una recepción de unidad.
 *
 * Solo se envía el grupo editado (vehículo, transportista o conductor). El
 * backend rechaza los campos que vinieron de una programación
 * (`campos_bloqueados`). El proveedor de la carga y las guías se editan por
 * sus propios endpoints.
 */
export interface DTO_ActualizarCampos {
  campos: {
    id_vehiculo?: number | null;
    id_tipo_vehiculo?: number | null;
    id_vehiculo_carreta?: number | null;
    id_empresa_transporte?: number | null;
    id_conductor?: number | null;
    /** Fecha y hora de ingreso (YYYY-MM-DD HH:MM:SS). */
    fecha_hora_ingreso?: string | null;
    /** Fecha y hora de salida (YYYY-MM-DD HH:MM:SS). */
    fecha_hora_salida?: string | null;
  };
  motivo?: string | null;
}

export interface CrearRecepcionRequest {
  id_vehiculo?: number;
  placa?: string;
  id_empresa_transporte: number;
  id_tipo_vehiculo?: number;
  id_conductor: number;
  /** Proveedores de la carga (modelo nuevo). */
  proveedores?: number[];
  /**
   * Guías por proveedor (modelo nuevo). `id_proveedor = 0` significa
   * "guía de la unidad": el proveedor se conoce con el registro de las
   * cargas.
   */
  guias?: IGuiaRecepcion[];
  /**
   * Archivos nuevos de las guías, indexados por la posición que ocupa la
   * guía dentro del array `guias`.
   */
  guias_archivos?: Record<
    number,
    { guia_remitente?: File; guia_transportista?: File }
  >;
  /** Archivo de la guía remitente de la unidad (ingreso directo). */
  guia_remitente_file?: File;
  /** Archivo de la guía transportista de la unidad (ingreso directo). */
  guia_transportista_file?: File;
  tipo_ingreso?: TipoIngreso;
  /**
   * Estado de la unidad al ingresar a planta: "Con Carga" o "Vacío".
   */
  estado_ingreso?: EstadoSalida | string;
  id_vehiculo_carreta?: number | null;
  observacion?: string;
  evidencias?: File[];
  id_sucursal?: number;
  id_motivo_ingreso?: number;
  vehiculos?: {
    id?: number;
    placa: string;
    cantidad_personas: number;
    archivos?: File[];
  }[];
  visitantes?: {
    nombre: string;
    apellido?: string;
    dni?: string;
    telefono?: string;
    es_conductor?: boolean;
    id_visita_vehiculo?: number;
    foto_documento?: File[];
  }[];
}

export interface RecepcionFilters {
  fecha_inicio?: string;
  fecha_fin?: string;
  placa?: string;
  id_empresa_transporte?: number;
}

export interface CrearVisitaVehiculoRequest {
  id_recepcion_visita: number;
  placa: string;
  cantidad_personas: number;
  archivos?: File[];
}

export interface ConfirmarVisitaPayload {
  id_recepcion_unidad: number;
  id_motivo_ingreso: number;
  observacion?: string;
  evidencias?: File[];
  vehiculos?: {
    id?: number;
    placa: string;
    cantidad_personas: number;
    archivos?: File[];
  }[];
  visitantes: {
    nombre: string;
    apellido?: string;
    dni?: string;
    telefono?: string;
    es_conductor?: boolean;
    id_visita_vehiculo?: number;
    foto_documento?: File[];
  }[];
}
