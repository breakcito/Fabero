import type { ElementoQuimicoValorizacion } from "../../../shared/enums/_generic/elemento-quimico-valorizacion";
import type { IArchivo } from "../../../shared/interfaces/archivo";

export interface REQ_FiltroValorizacionesVenta {
  id_planta?: number;
}

export interface REQ_ValorizacionVentaDetalleItem {
  id_despacho_detalle?: number;
  id_distribucion_detalle?: number;
  elemento_quimico: ElementoQuimicoValorizacion;
  id_condicion_comercial?: number | null;
  id_valor_elemento_quimico?: number | null;
  inter: number;
  des_inter: number;
  recuperacion: number;
  maquila: number;
  consumo: number;
  factor?: number;
}

export interface REQ_CrearValorizacionVenta {
  id_planta: number;
  id_empresa?: number | null;
  detalles: REQ_ValorizacionVentaDetalleItem[];
  codigo?: string | null;
  evidencias?: File[];
  fecha_hora_valorizacion?: string | null;
  monto_penalidad?: number;
  monto_flete?: number;
}

export interface REQ_EditarValorizacionVenta {
  id_planta: number;
  id_empresa?: number | null;
  detalles: REQ_ValorizacionVentaDetalleItem[];
  evidencias?: File[];
  evidencias_existentes?: IArchivo[];
  codigo?: string | null;
  fecha_hora_valorizacion?: string | null;
  monto_penalidad?: number;
  monto_flete?: number;
}

export interface REQ_AnularValorizacionVenta {
  motivo_anulacion: string;
  tipo_eliminacion: "logica" | "fisica";
  evidencias_anulacion?: File[];
}
