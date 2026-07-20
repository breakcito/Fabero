import { EstadoLeyes } from "../../../shared/enums/_generic/estado-leyes";
import { TipoOrigen } from "../../../shared/enums/_generic/tipo-origen";

export interface LoteSugeridoResponse {
  id: number;
  correlativo: string;
  numero_correlativo: number;
  condicion_ingreso: string;
  peso_neto: number | null;
  tipo_mineral: string | null;
  estado_leyes: EstadoLeyes | null;
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
  analisis: AnalisisMineralResponse[];
}
