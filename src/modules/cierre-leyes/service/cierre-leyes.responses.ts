import { TipoOrigen } from "../../../shared/enums/_generic/tipo-origen";
import type { RES_CambiosLog } from "../../../service/responses/_generic/cambios-log";

export interface IArchivoDoc {
  url: string;
  path_relativo: string;
  nombre_original: string;
  extension: string;
}

export interface LoteSugeridoResponse {
  id: number;
  correlativo: string;
  numero_correlativo: number;
  condicion_ingreso: string;
  peso_neto: number | null;
  tipo_mineral: string | null;
  id_proveedor_minero: number | null;
  proveedor_razon_social: string | null;
  created_at: string;
}

export interface AnalisisMineralResponse {
  id: number;
  id_grupo_analisis: number;
  id_laboratorio: number | null;
  laboratorio_nombre?: string | null;
  asumido_por: string;
  numero_ensayo: number;
  documentos: IArchivoDoc[];
  ley_oro: number;
  ley_plata: number;
  ley_humedad: number;
  ley_recuperacion: number;
  ley_oro_confirmada: boolean;
  ley_plata_confirmada: boolean;
  tipo_origen: TipoOrigen | null;
  sin_lote?: boolean;
  log_cambios?: RES_CambiosLog[] | null;
  created_at: string;
}

export interface GrupoAnalisisLoteResponse {
  id: number;
  id_empleado_registro: number;
  id_lote_mineral: number;
  id_muestra_externa: number;
  nombre: string;
  numero_correlativo: number;
  ley_oro_cierre: number;
  ley_plata_cierre: number;
  ley_humedad_cierre: number;
  ley_recuperacion_cierre: number;
  tiene_propuesta_oro: boolean;
  tiene_propuesta_plata: boolean;
  estado_valorizacion_oro?: "Propuesta" | "Aprobado" | null;
  estado_valorizacion_plata?: "Propuesta" | "Aprobado" | null;
  log_cambios?: RES_CambiosLog[] | null;
  created_at: string;
  empleado_registro_nombre?: string | null;
  total_muestras_asociadas?: number;
  analisis: AnalisisMineralResponse[];
}

export interface LoteCierreResponse {
  id: number;
  correlativo: string;
  numero_correlativo: number;
  condicion_ingreso: string;
  peso_neto: number | null;
  tipo_mineral: string | null;
  con_valor_comercial?: boolean | null;
  id_proveedor_minero: number | null;
  proveedor_razon_social: string | null;
  created_at?: string | null;
  grupo_analisis: GrupoAnalisisLoteResponse | null;
  grupos_analisis?: GrupoAnalisisLoteResponse[];
}

export interface MuestraExternaResponse {
  id: number;
  id_empleado_registro: number;
  id_muestra_externa: number;
  nombre: string;
  codigo_cliente?: string | null;
  correlativo?: string | null;
  id_proveedor?: number | null;
  proveedor_nombre?: string | null;
  numero_correlativo: number;
  created_at: string;
  empleado_registro_nombre?: string | null;
  analisis: AnalisisMineralResponse[];
}

export interface MuestraAsociadaResponse {
  id_muestra_externa: number;
  codigo_cliente?: string | null;
  proveedor_nombre?: string | null;
  id_laboratorio?: number | null;
  laboratorio_nombre?: string | null;
  numero_ensayo?: number;
  total_ensayos?: number;
  asumido_por?: string;
  created_at: string;
}
