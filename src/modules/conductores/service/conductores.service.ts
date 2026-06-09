import { api } from "../../../service/_api";
import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type { REQ_CrearConductor } from "./conductores.requests";
import type { RES_Conductor } from "./conductores.responses";

export const ConductoresService = {
  getConductores: async (): Promise<RES_Conductor[]> => {
    const { data } = await api.get("/conductores");
    return data.data;
  },

  crearConductor: async (
    payload: REQ_CrearConductor,
  ): Promise<RES_Conductor> => {
    const { data } = await api.post("/conductores", payload);
    return data.data;
  },

  editarConductor: async (
    id: number,
    payload: REQ_CrearConductor,
  ): Promise<RES_Conductor> => {
    const { data } = await api.put(`/conductores/${id}`, payload);
    return data.data;
  },

  cambiarEstadoConductor: async (
    id: number,
    estado: EstadoBase,
  ): Promise<boolean> => {
    const { data } = await api.patch(`/conductores/${id}/estado`, { estado });
    return data.success;
  },
};
