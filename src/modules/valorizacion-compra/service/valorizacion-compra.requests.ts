import type { TipoPagoValorizacionCompra } from "../../../shared/enums/valorizacion-compra/tipo-pago-valorizacion-compra";
import type { ElementoQuimicoValorizacion } from "../../../shared/enums/_generic/elemento-quimico-valorizacion";
import type { IArchivo } from "../../../shared/interfaces/archivo";

export interface REQ_FiltroValorizaciones {
  id_proveedor?: number;
}

export interface REQ_ValorizacionDetalleItem {
  id_lote_guia: number;
  elemento_quimico: ElementoQuimicoValorizacion;
  id_condicion_comercial?: number | null;
  inter: number;
  des_inter: number;
  recuperacion: number;
  maquila: number;
  consumo: number;
  factor?: number;
}

export interface REQ_ValorizacionAnticipoItem {
  id_anticipo_proveedor: number;
  monto_retirado: number;
  factura?: string;
}

export interface REQ_CrearValorizacion {
  id_proveedor_minero: number;
  id_concesion: number;
  id_cuenta_bancaria?: number | null;
  id_cuenta_detraccion?: number | null;
  tipo_pago: TipoPagoValorizacionCompra;
  detalles: REQ_ValorizacionDetalleItem[];
  anticipos?: REQ_ValorizacionAnticipoItem[];
  evidencias?: File[];
}

export interface REQ_EditarValorizacion {
  id_concesion: number;
  id_cuenta_bancaria?: number | null;
  id_cuenta_detraccion?: number | null;
  tipo_pago: TipoPagoValorizacionCompra;
  detalles: REQ_ValorizacionDetalleItem[];
  anticipos?: REQ_ValorizacionAnticipoItem[];
  evidencias?: File[];
  evidencias_existentes?: IArchivo[];
  motivo_edicion?: string;
}
