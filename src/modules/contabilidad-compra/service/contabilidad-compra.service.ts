import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type {
  REQ_AnularComprobante,
  REQ_AnularPago,
  REQ_AprobarComprobante,
  REQ_CrearComprobante,
  REQ_FiltroComprobantes,
  REQ_RegistrarPago,
} from "./contabilidad-compra.requests";
import type {
  RES_ComprobanteCompra,
  RES_PagoComprobante,
} from "./contabilidad-compra.responses";

const basePath = "/contabilidad-compra";

export const ContabilidadCompraService = {
  listarComprobantes: async (
    filters?: REQ_FiltroComprobantes,
  ): Promise<IRespuesta<RES_ComprobanteCompra[]>> => {
    const { data } = await api.get<IRespuesta<RES_ComprobanteCompra[]>>(
      `${basePath}/comprobantes`,
      { params: filters },
    );
    return data;
  },

  obtenerComprobante: async (
    id: number,
  ): Promise<IRespuesta<RES_ComprobanteCompra>> => {
    const { data } = await api.get<IRespuesta<RES_ComprobanteCompra>>(
      `${basePath}/comprobantes/${id}`,
    );
    return data;
  },

  crearComprobante: async (
    payload: REQ_CrearComprobante,
  ): Promise<IRespuesta<RES_ComprobanteCompra>> => {
    const formData = new FormData();
    formData.append("id_valorizacion_compra", String(payload.id_valorizacion_compra));
    formData.append("serie", payload.serie);
    formData.append("numero", payload.numero);
    formData.append("fecha_emision", payload.fecha_emision);
    if (payload.porcentaje_igv != null) {
      formData.append("porcentaje_igv", String(payload.porcentaje_igv));
    }
    if (payload.porcentaje_detraccion != null) {
      formData.append("porcentaje_detraccion", String(payload.porcentaje_detraccion));
    }
    if (payload.evidencias && payload.evidencias.length > 0) {
      payload.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }
    const { data } = await api.post<IRespuesta<RES_ComprobanteCompra>>(
      `${basePath}/comprobantes`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  aprobarComprobante: async (
    id: number,
    payload: REQ_AprobarComprobante,
  ): Promise<IRespuesta<RES_ComprobanteCompra>> => {
    const { data } = await api.post<IRespuesta<RES_ComprobanteCompra>>(
      `${basePath}/comprobantes/${id}/aprobar`,
      payload,
    );
    return data;
  },

  anularComprobante: async (
    id: number,
    payload: REQ_AnularComprobante,
  ): Promise<IRespuesta<RES_ComprobanteCompra>> => {
    const { data } = await api.post<IRespuesta<RES_ComprobanteCompra>>(
      `${basePath}/comprobantes/${id}/anular`,
      payload,
    );
    return data;
  },

  listarPagos: async (
    idComprobante: number,
  ): Promise<IRespuesta<RES_PagoComprobante[]>> => {
    const { data } = await api.get<IRespuesta<RES_PagoComprobante[]>>(
      `${basePath}/comprobantes/${idComprobante}/pagos`,
    );
    return data;
  },

  registrarPago: async (
    idComprobante: number,
    payload: REQ_RegistrarPago,
  ): Promise<IRespuesta<RES_PagoComprobante>> => {
    const formData = new FormData();
    if (payload.id_cuenta_bancaria_empresa != null) {
      formData.append("id_cuenta_bancaria_empresa", String(payload.id_cuenta_bancaria_empresa));
    }
    if (payload.id_cuenta_bancaria_proveedor != null) {
      formData.append("id_cuenta_bancaria_proveedor", String(payload.id_cuenta_bancaria_proveedor));
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
    const { data } = await api.post<IRespuesta<RES_PagoComprobante>>(
      `${basePath}/comprobantes/${idComprobante}/pagos`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  anularPago: async (
    idPago: number,
    payload: REQ_AnularPago,
  ): Promise<IRespuesta<RES_PagoComprobante>> => {
    const formData = new FormData();
    formData.append("motivo", payload.motivo);
    if (payload.evidencias_anulacion && payload.evidencias_anulacion.length > 0) {
      payload.evidencias_anulacion.forEach((file) => {
        formData.append("evidencias_anulacion[]", file);
      });
    }
    const { data } = await api.post<IRespuesta<RES_PagoComprobante>>(
      `${basePath}/pagos/${idPago}/anular`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },
};