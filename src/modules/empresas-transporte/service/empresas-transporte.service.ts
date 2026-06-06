import { api } from "../../../service/_api";
import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type { CrearEmpresaTransporteRequest } from "./empresas-transporte.requests";
import type { EmpresaTransporteResponse } from "./empresas-transporte.responses";

export const EmpresasTransporteService = {
  getEmpresasTransporte: async (): Promise<EmpresaTransporteResponse[]> => {
    const { data } = await api.get("/empresas-transporte");
    return data.data;
  },

  crearEmpresaTransporte: async (
    payload: CrearEmpresaTransporteRequest
  ): Promise<EmpresaTransporteResponse> => {
    const { data } = await api.post("/empresas-transporte", payload);
    return data.data;
  },

  editarEmpresaTransporte: async (
    id: number,
    payload: CrearEmpresaTransporteRequest
  ): Promise<EmpresaTransporteResponse> => {
    const { data } = await api.put(`/empresas-transporte/${id}`, payload);
    return data.data;
  },

  cambiarEstadoEmpresaTransporte: async (
    id: number,
    estado: EstadoBase
  ): Promise<EmpresaTransporteResponse> => {
    const { data } = await api.patch(`/empresas-transporte/${id}/estado`, { estado });
    return data.data;
  },
};
