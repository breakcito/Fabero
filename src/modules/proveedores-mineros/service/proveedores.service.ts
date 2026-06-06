import { api } from "../../../service/_api";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
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
  editarProveedor: async (
    id: number,
    payload: CrearProveedorRequest,
  ): Promise<ProveedorResponse> => {
    const { data } = await api.put(`/proveedores/${id}`, payload);
    return data.data;
  },
  cambiarEstadoProveedor: async (
    id: number,
    estado: EstadoBase,
  ): Promise<ProveedorResponse> => {
    const { data } = await api.patch(`/proveedores/${id}/estado`, { estado });
    return data.data;
  },
  eliminarProveedor: async (id: number): Promise<void> => {
    await api.delete(`/proveedores/${id}`);
  },
  getConcesionesProveedor: async (
    idProveedor: number,
  ): Promise<any[]> => {
    const { data } = await api.get(`/proveedores/${idProveedor}/concesiones`);
    return data.data;
  },
  asociarConcesionProveedor: async (
    idProveedor: number,
    idConcesion: number,
  ): Promise<void> => {
    await api.post("/proveedores/concesiones", {
      id_proveedor: idProveedor,
      id_concesion: idConcesion,
    });
  },
  desasociarConcesionProveedor: async (
    idProveedor: number,
    idConcesion: number,
  ): Promise<void> => {
    await api.delete(`/proveedores/${idProveedor}/concesiones/${idConcesion}`);
  },
  getEncargadosMuestraProveedor: async (
    idProveedor: number,
  ): Promise<any[]> => {
    const { data } = await api.get(`/proveedores/${idProveedor}/encargados-muestra`);
    return data.data;
  },
  asociarEncargadoMuestraProveedor: async (
    idProveedor: number,
    idEncargadoMuestra: number,
  ): Promise<void> => {
    await api.post("/proveedores/encargados-muestra", {
      id_proveedor: idProveedor,
      id_encargado_muestra: idEncargadoMuestra,
    });
  },
  desasociarEncargadoMuestraProveedor: async (
    idProveedor: number,
    idEncargadoMuestra: number,
  ): Promise<void> => {
    await api.delete(`/proveedores/${idProveedor}/encargados-muestra/${idEncargadoMuestra}`);
  },
  editarCuentaBancaria: async (
    id: number,
    payload: any,
  ): Promise<CuentaBancariaResponse> => {
    const { data } = await api.put(`/proveedores/cuentas-bancarias/${id}`, payload);
    return data.data;
  },
  cambiarEstadoCuentaBancaria: async (
    id: number,
    estado: EstadoBase,
  ): Promise<CuentaBancariaResponse> => {
    const { data } = await api.patch(`/proveedores/cuentas-bancarias/${id}/estado`, { estado });
    return data.data;
  },
  eliminarCuentaBancaria: async (id: number): Promise<void> => {
    await api.delete(`/proveedores/cuentas-bancarias/${id}`);
  },
};
