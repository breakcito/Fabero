import type { IArchivo } from "../../../shared/interfaces/archivo";
import { CondicionIngreso } from "../../../shared/enums/_generic/condicion-ingreso";

export interface DTO_CrearLote {
  condicion_ingreso: CondicionIngreso;
  id_empresa: number;
  con_codigo_manual: boolean;
  codigo_manual?: string;
  particionar?: boolean;
}

export interface DTO_PesoInicial {
  id_proveedor_minero: number | null;
  id_zona_origen: number | null;
  numero_contacto: string;
  tipo_producto: string | null;
  tipo_mineral: string | null;
  peso_inicial: number;
  evidencias?: File[];
}

export interface DTO_PesoFinal {
  peso_final: number;
  evidencias?: File[];
  evidencias_existentes?: IArchivo[];
  id_proveedor_minero?: number | null;
  id_zona_origen?: number | null;
  numero_contacto?: string;
  tipo_producto?: string | null;
  tipo_mineral?: string | null;
  peso_inicial?: number;
  id_vehiculo?: number | null;
  id_empresa_transporte?: number | null;
  id_tipo_vehiculo?: number | null;
  id_conductor?: number | null;
  condicion_ingreso?: string;
  motivo?: string;
}

// ─── Particiones desde Balanza ──────────────────────────────────────────────

export interface DTO_CrearParticion {
  id_recepcion_unidad: number;
}

export interface DTO_UpdateCamposNoPeso {
  id_proveedor_minero?: number | null;
  id_zona_origen?: number | null;
  numero_contacto?: string | null;
  tipo_producto?: string | null;
  tipo_mineral?: string | null;
}

export interface DTO_PesoInicialParticion {
  peso_inicial: number;
  observacion_peso_inicial?: string | null;
  evidencias?: File[];
  evidencias_existentes?: IArchivo[];
  // Campos no-peso: cuando se pesan PARTICIONES, el backend los persiste
  // también en `lote_mineral` para que las demás particiones del mismo lote
  // los hereden vía JOIN (cascada). Todos opcionales.
  id_proveedor_minero?: number | null;
  id_zona_origen?: number | null;
  numero_contacto?: string;
  tipo_producto?: string | null;
  tipo_mineral?: string | null;
}

export interface DTO_PesoFinalParticion {
  peso_final: number;
  observacion_peso_final?: string | null;
  evidencias?: File[];
  evidencias_existentes?: IArchivo[];
  // Ver DTO_PesoInicialParticion: cascada al lote padre para autocompletar
  // las demás particiones.
  id_proveedor_minero?: number | null;
  id_zona_origen?: number | null;
  numero_contacto?: string;
  tipo_producto?: string | null;
  tipo_mineral?: string | null;
}
