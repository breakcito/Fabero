import { EstadoLeyes } from "../../../shared/enums/_generic/estado-leyes";
import { TipoOrigen } from "../../../shared/enums/_generic/tipo-origen";

export interface AnalisisItemPayload {
  id_laboratorio?: number;
  asumido_por?: string;
  numero_ensayo?: number;
  tipo_origen?: TipoOrigen;
  documentos?: File[];
}

export interface AnalisisDraftItem {
  localId: string;
  id_laboratorio: number;
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
