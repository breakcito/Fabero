import { EstadoLeyes } from "../../../shared/enums/_generic/estado-leyes";
import { TipoOrigen } from "../../../shared/enums/_generic/tipo-origen";

export interface GuardarValorPayload {
  id?: number | null;
  id_lote_mineral: number;
  id_grupo_analisis_detalle: number;
  tipo_origen: TipoOrigen | null;
  uuid_fila: string;
  ley: number;
  esta_confirmada: boolean;
}

export interface GuardarValorMuestraPayload {
  id?: number | null;
  id_muestra_externa: number;
  id_grupo_analisis_detalle: number;
  tipo_origen: TipoOrigen | null;
  uuid_fila: string;
  ley: number;
  esta_confirmada: boolean;
}

export interface FiltrosLotesSugeridos {
  estado?: EstadoLeyes | "Todos";
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export interface IniciarLotePayload {
  id_lote_mineral: number;
}

export interface IniciarMuestraPayload {
  id_proveedor_minero: number;
  codigo_cliente?: string | null;
  fecha_hora_ingreso?: string | null;
}

export interface ConfirmarLotePayload {
  id_lote_mineral: number;
  con_valor_comercial: boolean;
  leyes_manuales?: Array<{
    id_grupo_analisis_detalle: number;
    ley: number;
  }>;
}

export interface AsociarMuestraPayload {
  id_lote_mineral: number;
}

export interface ActualizarOrigenFilaPayload {
  tipo_origen: TipoOrigen | null;
}
