import type { IGuiaRecepcion } from "../../../shared/interfaces/guia-recepcion";
import type { TipoIngreso } from "../../../shared/enums/_generic/tipo-ingreso";

/**
 * Una guía de la programación tal como se edita en el formulario: el
 * archivo ya guardado (IArchivo) y el archivo nuevo pendiente de subir
 * (File) conviven en la misma entrada.
 */
export interface GuiaProgramacionInput extends IGuiaRecepcion {
  guia_remitente_file: File | null;
  guia_transportista_file: File | null;
}

/**
 * Archivos nuevos por proveedor, indexados por la posición de la guía
 * dentro del array `guias`.
 */
export type GuiaProgramacionArchivos = Partial<
  Record<
    number,
    {
      guia_remitente?: File;
      guia_transportista?: File;
    }
  >
>;

export interface CrearProgramacionRequest {
  id_empresa_transporte: number;
  id_vehiculo?: number;
  id_tipo_vehiculo?: number;
  id_conductor?: number;
  id_sucursal?: number;
  fecha_estimada_llegada?: string;
  id_vehiculo_carreta?: number | null;
  observacion?: string;
  tipo_ingreso?: TipoIngreso | string;
  /** Proveedores de la carga: una entrada de guía por cada uno. */
  proveedores: number[];
  /** Guías por proveedor (texto + archivos ya guardados). */
  guias: IGuiaRecepcion[];
  /** Archivos nuevos que se suben junto con la programación. */
  guias_archivos: GuiaProgramacionArchivos;
}

export interface ProgramacionFilters {
  estado_confirmacion?: "todos" | "pendientes" | "confirmadas";
  solo_pendientes?: boolean;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}
