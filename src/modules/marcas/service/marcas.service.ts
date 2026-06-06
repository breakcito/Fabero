import { api } from "../../../service/_api";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export interface MarcaResponse {
  id: number;
  nombre: string;
  estado: EstadoBase;
}

export const MarcasService = {
  getMarcas: async (): Promise<MarcaResponse[]> => {
    const { data } = await api.get("/marcas");
    return data.data;
  },

  crearMarca: async (nombre: string): Promise<MarcaResponse> => {
    const { data } = await api.post("/marcas", { nombre });
    return data.data;
  },

  editarMarca: async (id: number, nombre: string): Promise<MarcaResponse> => {
    const { data } = await api.put(`/marcas/${id}`, { nombre });
    return data.data;
  },

  cambiarEstadoMarca: async (id: number, estado: EstadoBase): Promise<MarcaResponse> => {
    const { data } = await api.patch(`/marcas/${id}/estado`, { estado });
    return data.data;
  },
};
