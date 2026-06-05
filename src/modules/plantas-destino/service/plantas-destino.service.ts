import { api } from "../../../service/_api";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type {
  CrearPlantaDestinoRequest,
  CrearCuentaPlantaRequest,
  EditarCuentaPlantaRequest,
} from "./plantas-destino.requests";
import type {
  PlantaDestinoResponse,
  CuentaBancariaPlantaResponse,
} from "./plantas-destino.responses";

export const PlantasDestinoService = {
  getPlantas: async (): Promise<PlantaDestinoResponse[]> => {
    const { data } = await api.get("/plantas-destino");
    return data.data;
  },
  crearPlanta: async (
    payload: CrearPlantaDestinoRequest,
  ): Promise<PlantaDestinoResponse> => {
    const { data } = await api.post("/plantas-destino", payload);
    return data.data;
  },
  editarPlanta: async (
    id: number,
    payload: CrearPlantaDestinoRequest,
  ): Promise<PlantaDestinoResponse> => {
    const { data } = await api.put(`/plantas-destino/${id}`, payload);
    return data.data;
  },
  cambiarEstadoPlanta: async (
    id: number,
    estado: EstadoBase,
  ): Promise<PlantaDestinoResponse> => {
    const { data } = await api.patch(`/plantas-destino/${id}/estado`, { estado });
    return data.data;
  },

  /* Cuentas Bancarias */
  getCuentasBancarias: async (
    idPlanta: number,
  ): Promise<CuentaBancariaPlantaResponse[]> => {
    const { data } = await api.get(`/plantas-destino/cuentas-bancarias/${idPlanta}`);
    return data.data;
  },
  crearCuentaBancaria: async (
    payload: CrearCuentaPlantaRequest,
  ): Promise<CuentaBancariaPlantaResponse> => {
    const { data } = await api.post("/plantas-destino/cuentas-bancarias", payload);
    return data.data;
  },
  editarCuentaBancaria: async (
    id: number,
    payload: EditarCuentaPlantaRequest,
  ): Promise<CuentaBancariaPlantaResponse> => {
    const { data } = await api.put(`/plantas-destino/cuentas-bancarias/${id}`, payload);
    return data.data;
  },
  cambiarEstadoCuentaBancaria: async (
    id: number,
    estado: EstadoBase,
  ): Promise<CuentaBancariaPlantaResponse> => {
    const { data } = await api.patch(`/plantas-destino/cuentas-bancarias/${id}/estado`, { estado });
    return data.data;
  },

  /* Asociación de Proveedores */
  getProveedoresAsociados: async (idPlanta: number): Promise<any[]> => {
    const { data } = await api.get(`/plantas-destino/${idPlanta}/proveedores`);
    return data.data;
  },
  asociarProveedor: async (
    idPlanta: number,
    idProveedor: number,
  ): Promise<void> => {
    await api.post("/plantas-destino/proveedores", {
      id_planta: idPlanta,
      id_proveedor: idProveedor,
    });
  },
  desasociarProveedor: async (
    idPlanta: number,
    idProveedor: number,
  ): Promise<void> => {
    await api.delete(`/plantas-destino/${idPlanta}/proveedores/${idProveedor}`);
  },
};
