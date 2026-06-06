import { api } from "../../../service/_api";
import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type { CrearVehiculoRequest } from "./vehiculos.requests";
import type { VehiculoResponse } from "./vehiculos.responses";

export const VehiculosService = {
  getVehiculos: async (): Promise<VehiculoResponse[]> => {
    const { data } = await api.get("/vehiculos");
    return data.data;
  },

  crearVehiculo: async (payload: CrearVehiculoRequest): Promise<VehiculoResponse> => {
    const { data } = await api.post("/vehiculos", payload);
    return data.data;
  },

  editarVehiculo: async (id: number, payload: CrearVehiculoRequest): Promise<VehiculoResponse> => {
    const { data } = await api.put(`/vehiculos/${id}`, payload);
    return data.data;
  },

  cambiarEstadoVehiculo: async (id: number, estado: EstadoBase): Promise<VehiculoResponse> => {
    const { data } = await api.patch(`/vehiculos/${id}/estado`, { estado });
    return data.data;
  },
};
