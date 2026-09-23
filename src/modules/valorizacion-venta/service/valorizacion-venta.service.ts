import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type {
  RES_ValorizacionVenta,
  RES_DistribucionDetalleDisponible,
  RES_CondicionComercialPlanta,
} from "./valorizacion-venta.responses";
import type {
  REQ_FiltroValorizacionesVenta,
  REQ_CrearValorizacionVenta,
  REQ_EditarValorizacionVenta,
  REQ_AnularValorizacionVenta,
} from "./valorizacion-venta.requests";

const basePath = "/valorizacion-venta";

export const ValorizacionVentaService = {
  listarValorizaciones: async (
    filters?: REQ_FiltroValorizacionesVenta,
  ): Promise<IRespuesta<RES_ValorizacionVenta[]>> => {
    const { data } = await api.get<IRespuesta<RES_ValorizacionVenta[]>>(
      basePath,
      { params: filters },
    );
    return data;
  },

  obtenerValorizacion: async (
    id: number,
  ): Promise<IRespuesta<RES_ValorizacionVenta>> => {
    const { data } = await api.get<IRespuesta<RES_ValorizacionVenta>>(
      `${basePath}/${id}`,
    );
    return data;
  },

  crearValorizacion: async (
    payload: REQ_CrearValorizacionVenta,
  ): Promise<IRespuesta<RES_ValorizacionVenta>> => {
    const formData = new FormData();
    formData.append("id_planta", String(payload.id_planta));
    formData.append("detalles", JSON.stringify(payload.detalles));
    if (payload.codigo) {
      formData.append("codigo", payload.codigo);
    }
    if (payload.evidencias && payload.evidencias.length > 0) {
      payload.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }
    if (payload.fecha_hora_valorizacion) {
      formData.append("fecha_hora_valorizacion", payload.fecha_hora_valorizacion);
    }
    if (payload.monto_penalidad != null) {
      formData.append("monto_penalidad", String(payload.monto_penalidad));
    }
    if (payload.monto_flete != null) {
      formData.append("monto_flete", String(payload.monto_flete));
    }
    const { data } = await api.post<IRespuesta<RES_ValorizacionVenta>>(
      `${basePath}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  editarValorizacion: async (
    id: number,
    payload: REQ_EditarValorizacionVenta,
  ): Promise<IRespuesta<RES_ValorizacionVenta>> => {
    const formData = new FormData();
    formData.append("_method", "PUT");
    formData.append("id_planta", String(payload.id_planta));
    formData.append("detalles", JSON.stringify(payload.detalles));
    if (payload.codigo) {
      formData.append("codigo", payload.codigo);
    }
    formData.append(
      "evidencias_existentes",
      JSON.stringify(payload.evidencias_existentes ?? []),
    );
    if (payload.evidencias && payload.evidencias.length > 0) {
      payload.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }
    if (payload.fecha_hora_valorizacion) {
      formData.append("fecha_hora_valorizacion", payload.fecha_hora_valorizacion);
    }
    if (payload.monto_penalidad != null) {
      formData.append("monto_penalidad", String(payload.monto_penalidad));
    }
    if (payload.monto_flete != null) {
      formData.append("monto_flete", String(payload.monto_flete));
    }
    const { data } = await api.post<IRespuesta<RES_ValorizacionVenta>>(
      `${basePath}/${id}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  aprobarValorizacion: async (id: number): Promise<IRespuesta<RES_ValorizacionVenta>> => {
    const { data } = await api.post<IRespuesta<RES_ValorizacionVenta>>(
      `${basePath}/${id}/aprobar`,
    );
    return data;
  },

  anularValorizacion: async (
    id: number,
    payload: REQ_AnularValorizacionVenta,
  ): Promise<IRespuesta<RES_ValorizacionVenta>> => {
    const formData = new FormData();
    formData.append("motivo_anulacion", payload.motivo_anulacion);
    formData.append("tipo_eliminacion", payload.tipo_eliminacion);
    const { data } = await api.post<IRespuesta<RES_ValorizacionVenta>>(
      `${basePath}/${id}/anular`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },
};

export const ValorizacionVentaAuxService = {
  getPlantasConDistribuciones: async (): Promise<IRespuesta<Array<{
    id: number;
    ruc: string;
    razon_social: string;
  }>>> => {
    const { data } = await api.get("/aux/plantas-con-distribuciones-valorizacion");
    return data;
  },

  getDistribucionesDetallesDisponibles: async (
    idPlanta: number,
    idValorizacion?: number,
  ): Promise<IRespuesta<RES_DistribucionDetalleDisponible[]>> => {
    const params: Record<string, number> = { id_planta: idPlanta };
    if (idValorizacion) {
      params.id_valorizacion = idValorizacion;
    }
    const { data } = await api.get("/aux/distribuciones-detalles-disponibles-valorizacion", { params });
    return data;
  },

  getCondicionesComercialesPlanta: async (
    idPlanta: number,
  ): Promise<IRespuesta<{ Oro: RES_CondicionComercialPlanta[]; Plata: RES_CondicionComercialPlanta[] }>> => {
    const { data } = await api.get("/aux/condiciones-comerciales-planta", {
      params: { id_planta: idPlanta },
    });
    return data;
  },
};
