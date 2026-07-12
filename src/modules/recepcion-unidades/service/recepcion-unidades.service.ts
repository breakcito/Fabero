import { api } from "../../../service/_api";
import type { CrearRecepcionRequest, RecepcionFilters } from "./recepcion-unidades.requests";
import type { RecepcionUnidadResponse } from "./recepcion-unidades.responses";

export const RecepcionUnidadesService = {
  /**
   * Obtener listado de recepciones filtradas
   */
  getRecepciones: async (
    filters?: RecepcionFilters
  ): Promise<RecepcionUnidadResponse[]> => {
    const { data } = await api.get("/recepcion-unidades", {
      params: filters,
    });
    return data.data;
  },
  
  /**
   * Registrar un nuevo ingreso de unidad con sus evidencias físicas
   */
  crearRecepcion: async (
    payload: CrearRecepcionRequest
  ): Promise<RecepcionUnidadResponse> => {
    const formData = new FormData();
    formData.append("id_vehiculo", String(payload.id_vehiculo));
    formData.append("id_empresa_transporte", String(payload.id_empresa_transporte));
    formData.append("id_tipo_vehiculo", String(payload.id_tipo_vehiculo));
    formData.append("id_conductor", String(payload.id_conductor));
    formData.append("tipo_ingreso", payload.tipo_ingreso);
    formData.append("tipo_carga", payload.tipo_carga);
    if (payload.id_sucursal) {
      formData.append("id_sucursal", String(payload.id_sucursal));
    }
    
    if (payload.segunda_placa) {
      formData.append("segunda_placa", payload.segunda_placa);
    }
    
    if (payload.observacion) {
      formData.append("observacion", payload.observacion);
    }
    
    if (payload.evidencias && payload.evidencias.length > 0) {
      payload.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }

    const { data } = await api.post("/recepcion-unidades", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data.data;
  },

  /**
   * Registrar la salida de una unidad
   */
  registrarSalida: async (
    id: number,
    payload: { estado_salida: string; observacion_salida: string }
  ): Promise<RecepcionUnidadResponse> => {
    const { data } = await api.put(`/recepcion-unidades/${id}/salida`, payload);
    return data.data;
  },

};
