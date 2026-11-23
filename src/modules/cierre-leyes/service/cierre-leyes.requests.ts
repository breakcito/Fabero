import { EstadoLeyes } from "../../../shared/enums/_generic/estado-leyes";
import { TipoOrigen } from "../../../shared/enums/_generic/tipo-origen";

/** Quién asume el análisis. El valor se almacena tal cual en `asumido_por`. */
export const ASUMIDO_POR_FABERO = "Fabero";
export const ASUMIDO_POR_PROVEEDOR = "Proveedor";
export type AsumidoPor = typeof ASUMIDO_POR_FABERO | typeof ASUMIDO_POR_PROVEEDOR;

/**
 * Leyes opcionales que se pueden registrar junto al análisis.
 *
 * Humedad y recuperación viajan en DECIMAL (0.06 = 6%): es el contrato con el
 * API y con la BD. La UI captura y muestra porcentajes y convierte en la
 * frontera (formulario del ítem / hook de la tabla).
 */
export interface LeyesAnalisis {
  ley_oro?: number | null;
  ley_plata?: number | null;
  ley_humedad?: number | null;
  ley_recuperacion?: number | null;
}

export interface AnalisisItemPayload extends LeyesAnalisis {
  id_laboratorio?: number | null;
  asumido_por?: string;
  numero_ensayo?: number;
  tipo_origen?: TipoOrigen;
  documentos?: File[];
}

export interface AnalisisDraftItem extends LeyesAnalisis {
  localId: string;
  /** El laboratorio es opcional. */
  id_laboratorio: number | null;
  laboratorio_nombre: string;
  asumido_por: string;
  numero_ensayo: number;
  tipo_origen: TipoOrigen;
  documentos: File[];
}

export interface CrearGrupoPayload {
  id_lote_mineral?: number;
  id_muestra_externa?: number;
  nombre: string;
  id_laboratorio?: number;
  asumido_por?: string;
  numero_ensayo?: number;
  tipo_origen?: TipoOrigen;
  documentos?: File[];
  analisis?: AnalisisItemPayload[];
}

export interface AgregarAnalisisGrupoPayload {
  id_laboratorio?: number;
  asumido_por?: string;
  numero_ensayo?: number;
  tipo_origen?: TipoOrigen;
  documentos?: File[];
  analisis?: AnalisisItemPayload[];
}

/**
 * Valores editados en la tabla de análisis.
 *
 * Humedad y recuperación llegan en PORCENTAJE (lo que ve el operador) y el
 * hook `useCierreLeyes` los convierte a decimal antes de enviar al API.
 */
export interface GuardarValoresAnalisisPayload {
  ley_oro?: number;
  ley_plata?: number;
  ley_humedad?: number;
  ley_recuperacion?: number;
  ley_oro_confirmada?: boolean;
  ley_plata_confirmada?: boolean;
  tipo_origen?: TipoOrigen | null;
  asumido_por?: string;
  numero_ensayo?: number;
  id_laboratorio?: number | null;
  motivo?: string;
}

/**
 * Leyes de cierre editadas en la tabla de grupos.
 *
 * Humedad y recuperación llegan en PORCENTAJE (lo que ve el operador) y el
 * hook `useCierreLeyes` los convierte a decimal antes de enviar al API.
 */
export interface GuardarLeyesCierreGrupoPayload {
  ley_oro_cierre?: number;
  ley_plata_cierre?: number;
  ley_humedad_cierre?: number;
  ley_recuperacion_cierre?: number;
  motivo?: string;
}

export interface FiltrosLotesSugeridos {
  estado?: EstadoLeyes | "Todos";
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export interface ConfirmarLotePayload {
  con_valor_comercial: boolean;
}

export interface IniciarMuestraPayload {
  codigo_cliente?: string;
  nombre?: string;
  id_proveedor?: number;
  proveedor_nombre?: string;
  fecha?: string;
  id_laboratorio?: number;
  asumido_por?: string;
  numero_ensayo?: number;
  documentos?: File[];
  analisis?: AnalisisItemPayload[];
}
