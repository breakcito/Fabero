import { api } from "../../../service/_api";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type {
  CrearCuentaBancariaRequest,
  CrearProveedorRequest,
  CrearContactoProveedorRequest,
  EditarCuentaBancariaRequest,
  EditarContactoProveedorRequest,
} from "./proveedores.requests";
import type {
  CuentaBancariaResponse,
  ProveedorResponse,
  RES_ContactoDocumento,
  RES_ContactoProveedor,
} from "./proveedores.responses";
import type { RES_Concesion } from "./concesiones.responses";


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
  ): Promise<RES_Concesion[]> => {
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

  editarCuentaBancaria: async (
    id: number,
    payload: EditarCuentaBancariaRequest,
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

  getContactosProveedor: async (
    idProveedor: number,
  ): Promise<RES_ContactoProveedor[]> => {
    const { data } = await api.get(`/proveedores/${idProveedor}/contactos`);
    return data.data;
  },

  /**
   * Contacto que debe figurar en los documentos del proveedor.
   *
   * Si el proveedor no tiene contactos registrados, devuelve los datos del
   * propio proveedor (origen: "proveedor").
   */
  getContactoDocumento: async (
    idProveedor: number,
  ): Promise<RES_ContactoDocumento> => {
    const { data } = await api.get(`/proveedores/${idProveedor}/contacto-documento`);
    return data.data;
  },

  crearContactoProveedor: async (
    payload: CrearContactoProveedorRequest,
  ): Promise<RES_ContactoProveedor> => {
    const { data } = await api.post("/proveedores/contactos", payload);
    return data.data;
  },

  editarContactoProveedor: async (
    id: number,
    payload: EditarContactoProveedorRequest,
  ): Promise<RES_ContactoProveedor> => {
    const { data } = await api.put(`/proveedores/contactos/${id}`, payload);
    return data.data;
  },

  eliminarContactoProveedor: async (id: number): Promise<void> => {
    await api.delete(`/proveedores/contactos/${id}`);
  },
};
