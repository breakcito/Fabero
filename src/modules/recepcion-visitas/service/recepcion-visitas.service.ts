import { api } from "../../../service/_api";
import type { CrearRecepcionVisitaRequest, RecepcionVisitaFilters } from "./recepcion-visitas.requests";
import type { RecepcionVisitaResponse } from "./recepcion-visitas.responses";

export const RecepcionVisitasService = {
  /**
   * Obtener listado de recepciones de visitas filtradas
   */
  getRecepciones: async (
    filters?: RecepcionVisitaFilters
  ): Promise<RecepcionVisitaResponse[]> => {
    const { data } = await api.get("/recepcion-visitas", {
      params: filters,
    });
    return data.data;
  },

  /**
   * Registrar una nueva recepción de visita (incluyendo visitantes y sus archivos adjuntos)
   */
  crearRecepcion: async (
    payload: CrearRecepcionVisitaRequest
  ): Promise<RecepcionVisitaResponse> => {
    const formData = new FormData();
    formData.append("id_empleado_contacto", String(payload.id_empleado_contacto));
    formData.append("id_motivo_ingreso", String(payload.id_motivo_ingreso));
    formData.append("con_vehiculo", payload.con_vehiculo ? "1" : "0");
    
    if (payload.observacion) {
      formData.append("observacion", payload.observacion);
    }
    
    if (payload.con_vehiculo) {
      if (payload.serie_placa) formData.append("serie_placa", payload.serie_placa);
      if (payload.numero_placa) formData.append("numero_placa", payload.numero_placa);
    }

    payload.visitantes.forEach((v, index) => {
      if (v.id_visitante) {
        formData.append(`visitantes[${index}][id_visitante]`, String(v.id_visitante));
      }
      
      // Enviamos siempre los datos del visitante (si son cargados o nuevos)
      if (v.nombre) formData.append(`visitantes[${index}][nombre]`, v.nombre);
      if (v.apellido) formData.append(`visitantes[${index}][apellido]`, v.apellido);
      if (v.dni) formData.append(`visitantes[${index}][dni]`, v.dni);
      if (v.telefono) {
        formData.append(`visitantes[${index}][telefono]`, v.telefono);
      }
      
      if (v.foto_documento) {
        formData.append(`visitantes[${index}][foto_documento]`, v.foto_documento);
      }
    });

    const { data } = await api.post("/recepcion-visitas", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data.data;
  },

  /**
   * Registrar la salida de una visita
   */
  registrarSalida: async (
    id: number,
    payload: { observacion_salida?: string }
  ): Promise<RecepcionVisitaResponse> => {
    const { data } = await api.put(`/recepcion-visitas/${id}/salida`, payload);
    return data.data;
  },
};
