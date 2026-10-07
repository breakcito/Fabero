import { EstadoLeyes } from "../../../shared/enums/_generic/estado-leyes";
import { TipoOrigen } from "../../../shared/enums/_generic/tipo-origen";
import type { RES_CambiosLog } from "../../../service/responses/_generic/cambios-log";

export interface LoteSugeridoResponse {
  id: number;
  correlativo: string;
  numero_correlativo: number;
  condicion_ingreso: string;
  peso_neto: number | null;
  tipo_mineral: string | null;
  estado_leyes: EstadoLeyes | null;
  id_proveedor_minero: number | null;
  proveedor_razon_social: string | null;
  created_at: string;
}

export interface AnalisisMineralResponse {
  id: number;
  id_grupo_analisis_detalle: number;
  id_grupo_analisis: number;
  id_analito: number;
  uuid_fila: string;
  ley: number;
  esta_confirmada: boolean;
  tipo_origen: TipoOrigen | null;
  log_cambios?: RES_CambiosLog[] | null;
  created_at: string;
}

export interface LoteCierreResponse {
  id: number;
  correlativo: string;
  numero_correlativo: number;
  condicion_ingreso: string;
  peso_neto: number | null;
  tipo_mineral: string | null;
  estado_leyes: EstadoLeyes;
  con_valor_comercial: boolean | null;
  fecha_hora_inicio_analisis: string | null;
  empleado_inicio_nombre: string | null;
  fecha_hora_confirmacion_analisis: string | null;
  empleado_confirmacion_nombre: string | null;
  ley_oro: number | null;
  ley_plata: number | null;
  ley_humedad: number | null;
  ley_recuperacion: number | null;
  id_proveedor_minero: number | null;
  proveedor_razon_social: string | null;
  created_at?: string | null;
  analisis: AnalisisMineralResponse[];
}

export interface MuestraExternaResponse {
  id: number;
  id_empleado_registro: number;
  id_proveedor_minero: number;
  correlativo: string;
  numero_correlativo: number;
  created_at: string;
  proveedor_razon_social: string | null;
  empleado_registro_nombre: string | null;
  analisis: AnalisisMineralResponse[];
}

export interface MuestraAsociadaResponse {
  id: number;
  id_empleado_registro: number;
  id_proveedor_minero: number;
  correlativo: string;
  numero_correlativo: number;
  created_at: string;
  proveedor_razon_social: string | null;
  empleado_registro_nombre: string | null;
}

export interface AsociarMuestraResponse {
  lote: LoteCierreResponse;
  muestra: MuestraExternaResponse;
  analisis_migrados: number;
  lote_iniciado: boolean;
}
