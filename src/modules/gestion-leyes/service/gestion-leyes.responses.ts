import { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export interface AnalitoResponse {
  id: number;
  nombre: string;
  es_desplegable: boolean;
  estado: EstadoBase;
}

export interface GrupoAnalisisDetalleResponse {
  detalle_id: number;
  id_analito: number;
  nombre: string;
  es_desplegable: boolean;
  para_valorizacion_oro: boolean;
  para_valorizacion_plata: boolean;
  para_valorizacion_humedad: boolean;
  para_valorizacion_recuperacion: boolean;
}

export interface GrupoAnalisisResponse {
  id: number;
  nombre: string;
  orden: number;
  indicar_origen: boolean;
  estado: string;
  analitos: GrupoAnalisisDetalleResponse[];
}
