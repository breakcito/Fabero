import { api } from "../../../service/_api";
import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type { CrearConductorRequest } from "./conductores.requests";
import type { ConductorResponse } from "./conductores.responses";

export const ConductoresService = {
  getConductores: async (): Promise<ConductorResponse[]> => {
    const { data } = await api.get("/conductores");
    return data.data;
  },

  crearConductor: async (payload: CrearConductorRequest): Promise<ConductorResponse> => {
    const { data } = await api.post("/conductores", payload);
    return data.data;
  },

  editarConductor: async (id: number, payload: CrearConductorRequest): Promise<ConductorResponse> => {
    const { data } = await api.put(`/conductores/${id}`, payload);
    return data.data;
  },

  cambiarEstadoConductor: async (id: number, estado: EstadoBase): Promise<ConductorResponse> => {
    const { data } = await api.patch(`/conductores/${id}/estado`, { estado });
    return data.data;
  },
};
