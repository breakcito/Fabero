import { api } from "../../../service/_api";
import type {
  CrearCuentaBancariaRequest,
  CrearProveedorRequest,
} from "./proveedores.requests";
import type {
  CuentaBancariaResponse,
  ProveedorResponse,
} from "./proveedores.responses";

export const ProveedoresService = {
  getProveedores: async (): Promise<ProveedorResponse[]> => {
    const { data } = await api.get("/proveedores");
    return data.data; // Retorna el payload del ApiResponse
  },
  crearProveedor: async (
    payload: CrearProveedorRequest,
  ): Promise<ProveedorResponse> => {
    const { data } = await api.post("/proveedores", payload);
    return data.data;
  },

  getCuentasBancarias: async (
    idProveedor: number,
  ): Promise<CuentaBancariaResponse[]> => {
    const { data } = await api.get(
      `/proveedores/cuentas-bancarias/${idProveedor}`,
    );
    return data.data;
  },
  crearCuentaBancaria: async (
    payload: CrearCuentaBancariaRequest,
  ): Promise<CuentaBancariaResponse> => {
    const { data } = await api.post("/proveedores/cuentas-bancarias", payload);
    return data.data;
  },
};
