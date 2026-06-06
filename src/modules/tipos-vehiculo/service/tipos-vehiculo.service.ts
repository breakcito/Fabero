import { api } from "../../../service/_api";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export interface TipoVehiculoResponse {
  id: number;
  nombre: string;
  tiene_carreta: boolean;
  es_carreta: boolean;
  estado: EstadoBase;
}

export const TiposVehiculoService = {
  getTiposVehiculo: async (): Promise<TipoVehiculoResponse[]> => {
    const { data } = await api.get("/tipos-vehiculo");
    return data.data;
  },

  crearTipoVehiculo: async (
    nombre: string,
    tieneCarreta: boolean,
    esCarreta: boolean
  ): Promise<TipoVehiculoResponse> => {
    const { data } = await api.post("/tipos-vehiculo", {
      nombre,
      tiene_carreta: tieneCarreta,
      es_carreta: esCarreta,
    });
    return data.data;
  },

  editarTipoVehiculo: async (
    id: number,
    nombre: string,
    tieneCarreta: boolean,
    esCarreta: boolean
  ): Promise<TipoVehiculoResponse> => {
    const { data } = await api.put(`/tipos-vehiculo/${id}`, {
      nombre,
      tiene_carreta: tieneCarreta,
      es_carreta: esCarreta,
    });
    return data.data;
  },

  cambiarEstadoTipoVehiculo: async (
    id: number,
    estado: EstadoBase
  ): Promise<TipoVehiculoResponse> => {
    const { data } = await api.patch(`/tipos-vehiculo/${id}/estado`, { estado });
    return data.data;
  },
};
