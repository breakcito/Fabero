import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type {
  REQ_AnularComprobanteVenta,
  REQ_AnularPagoVenta,
  REQ_CrearComprobanteVenta,
  REQ_FiltroComprobantesVenta,
  REQ_RegistrarPagoVenta,
} from "./contabilidad-venta.requests";
import type {
  RES_ComprobanteVenta,
  RES_DetalleValorizacionDisponible,
  RES_PagoComprobanteVenta,
} from "./contabilidad-venta.responses";

const basePath = "/contabilidad-venta";

export const ContabilidadVentaService = {
  listarComprobantes: async (
    filters?: REQ_FiltroComprobantesVenta,
  ): Promise<IRespuesta<RES_ComprobanteVenta[]>> => {
    const { data } = await api.get<IRespuesta<RES_ComprobanteVenta[]>>(
      `${basePath}/comprobantes`,
      { params: filters },
    );
    return data;
  },

  obtenerComprobante: async (
    id: number,
  ): Promise<IRespuesta<RES_ComprobanteVenta>> => {
    const { data } = await api.get<IRespuesta<RES_ComprobanteVenta>>(
      `${basePath}/comprobantes/${id}`,
    );
    return data;
  },

  getDetallesDisponibles: async (
    idPlanta: number,
  ): Promise<IRespuesta<RES_DetalleValorizacionDisponible[]>> => {
    const { data } = await api.get<IRespuesta<RES_DetalleValorizacionDisponible[]>>(
      `${basePath}/detalles-disponibles`,
      { params: { id_planta: idPlanta } },
    );
    return data;
  },

  getAnticiposDisponibles: async (
    idPlanta: number,
  ): Promise<IRespuesta<Array<{
    id: number;
    id_planta: number;
    codigo_comprobante: string | null;
    saldo_inicial: number;
    saldo_actual: number;
    estado: string;
    created_at: string;
  }>>> => {
    const { data } = await api.get(
      `${basePath}/anticipos-disponibles`,
      { params: { id_planta: idPlanta } },
    );
    return data;
  },

  crearComprobante: async (
    payload: REQ_CrearComprobanteVenta,
  ): Promise<IRespuesta<RES_ComprobanteVenta>> => {
    const formData = new FormData();
    formData.append("id_planta_destino", String(payload.id_planta_destino));
    if (payload.id_empresa) {
      formData.append("id_empresa", String(payload.id_empresa));
    }
    formData.append("id_tipo_cambio", String(payload.id_tipo_cambio));
    formData.append("codigo_comprobante", payload.codigo_comprobante);
    formData.append("fecha_emision", payload.fecha_emision);
    formData.append("detalles_ids", JSON.stringify(payload.detalles_ids));

    if (payload.monto_penalidad != null) {
      formData.append("monto_penalidad", String(payload.monto_penalidad));
    }
    if (payload.monto_flete != null) {
      formData.append("monto_flete", String(payload.monto_flete));
    }
    if (payload.percentaje_igv != null) {
      formData.append("percentaje_igv", String(payload.percentaje_igv));
    }
    if (payload.porcentaje_detraccion != null) {
      formData.append("porcentaje_detraccion", String(payload.porcentaje_detraccion));
    }
    if (payload.anticipos && payload.anticipos.length > 0) {
      formData.append("anticipos", JSON.stringify(payload.anticipos));
    }
    if (payload.evidencias && payload.evidencias.length > 0) {
      payload.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }

    const { data } = await api.post<IRespuesta<RES_ComprobanteVenta>>(
      `${basePath}/comprobantes`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  anularComprobante: async (
    id: number,
    payload: REQ_AnularComprobanteVenta,
  ): Promise<IRespuesta<RES_ComprobanteVenta>> => {
    const formData = new FormData();
    formData.append("motivo", payload.motivo);
    if (payload.evidencias && payload.evidencias.length > 0) {
      payload.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }

    const { data } = await api.post<IRespuesta<RES_ComprobanteVenta>>(
      `${basePath}/comprobantes/${id}/anular`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  listarPagos: async (
    idComprobante: number,
  ): Promise<IRespuesta<RES_PagoComprobanteVenta[]>> => {
    const { data } = await api.get<IRespuesta<RES_PagoComprobanteVenta[]>>(
      `${basePath}/comprobantes/${idComprobante}/pagos`,
    );
    return data;
  },

  registrarPago: async (
    idComprobante: number,
    payload: REQ_RegistrarPagoVenta,
  ): Promise<IRespuesta<RES_ComprobanteVenta>> => {
    const formData = new FormData();
    if (payload.id_cuenta_bancaria_planta != null) {
      formData.append("id_cuenta_bancaria_planta", String(payload.id_cuenta_bancaria_planta));
    }
    if (payload.id_cuenta_bancaria_empresa != null) {
      formData.append("id_cuenta_bancaria_empresa", String(payload.id_cuenta_bancaria_empresa));
    }
    formData.append("es_para_detraccion", payload.es_para_detraccion ? "1" : "0");
    formData.append("medio_pago", payload.medio_pago);
    formData.append("monto_pagado", String(payload.monto_pagado));
    if (payload.fecha_hora_pago) {
      formData.append("fecha_hora_pago", payload.fecha_hora_pago);
    }
    if (payload.numero_operacion) {
      formData.append("numero_operacion", payload.numero_operacion);
    }
    if (payload.observacion) {
      formData.append("observacion", payload.observacion);
    }
    if (payload.evidencias && payload.evidencias.length > 0) {
      payload.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }

    const { data } = await api.post<IRespuesta<RES_ComprobanteVenta>>(
      `${basePath}/comprobantes/${idComprobante}/pagos`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  anularPago: async (
    idPago: number,
    _idComprobante: number,
    payload: REQ_AnularPagoVenta,
  ): Promise<IRespuesta<null>> => {
    const formData = new FormData();
    formData.append("motivo", payload.motivo);
    if (payload.evidencias_anulacion && payload.evidencias_anulacion.length > 0) {
      payload.evidencias_anulacion.forEach((file) => {
        formData.append("evidencias_anulacion[]", file);
      });
    }

    const { data } = await api.post<IRespuesta<null>>(
      `${basePath}/pagos/${idPago}/anular`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },
};
