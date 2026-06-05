import { api } from "./_api";
import type { IRespuesta } from "../shared/interfaces/_response";
import type { RES_Proveedor } from "./responses/proveedor";
import type { RES_Empleado } from "./responses/empleado";
import type { RES_Empresa } from "./responses/empresa";
import type { RES_Marca } from "./responses/marca";
import type { TipoEntidad } from "../shared/enums/_generic/tipo-entidad";
import type { RES_Banco } from "./responses/banco";
import type {
  RES_Departamento,
  RES_Provincia,
  RES_Distrito,
} from "../modules/sucursales/service/sucursales.responses";

const path = "/aux";

export const AuxService = {
  get_empleados: async (filters?: {
    id_empleado?: number;
    estado?: string;
  }): Promise<IRespuesta<RES_Empleado[]>> => {
    const { data } = await api.get(`${path}/empleados`, {
      params: filters,
    });
    return data;
  },

  /**
   * Obtener proveedores
   */
  get_proveedores: async (filters?: {
    id_proveedor?: number;
    estado?: string;
    tipo_entidad?: TipoEntidad;
  }): Promise<IRespuesta<RES_Proveedor[]>> => {
    const { data } = await api.get<IRespuesta<RES_Proveedor[]>>(
      `${path}/proveedores`,
      { params: filters },
    );
    return data;
  },

  get_empresas: async (filters?: {
    id_empresa?: number;
    estado?: string;
  }): Promise<IRespuesta<RES_Empresa[]>> => {
    const { data } = await api.get<IRespuesta<RES_Empresa[]>>(
      `${path}/empresas`,
      { params: filters },
    );
    return data;
  },

  /**
   * Obtener lista de marcas
   */
  get_marcas: async (filters?: {
    id_marca?: number;
    estado?: string;
  }): Promise<IRespuesta<RES_Marca[]>> => {
    const { data } = await api.get<IRespuesta<RES_Marca[]>>(`${path}/marcas`, {
      params: filters,
    });
    return data;
  },

  /**
   * Crear una nueva marca
   */
  crear_marca: async (nuevaMarca: {
    nombre: string;
  }): Promise<IRespuesta<RES_Marca>> => {
    const { data } = await api.post<IRespuesta<RES_Marca>>(
      `${path}/marcas`,
      nuevaMarca,
    );
    return data;
  },

  getBancos: async (): Promise<IRespuesta<RES_Banco[]>> => {
    const { data } = await api.get<IRespuesta<RES_Banco[]>>(
      "/proveedores/bancos",
    );
    return data;
  },

  crearBanco: async (payload: {
    nombre: string;
    abreviatura: string;
  }): Promise<RES_Banco> => {
    const { data } = await api.post("/proveedores/bancos", payload);
    return data.data;
  },

  get_departamentos: async (): Promise<IRespuesta<RES_Departamento[]>> => {
    const { data } = await api.get<IRespuesta<RES_Departamento[]>>(
      `${path}/departamentos`,
    );
    return data;
  },

  get_provincias: async (
    id_departamento: number,
  ): Promise<IRespuesta<RES_Provincia[]>> => {
    const { data } = await api.get<IRespuesta<RES_Provincia[]>>(
      `${path}/provincias`,
      {
        params: { id_departamento },
      },
    );
    return data;
  },

  get_distritos: async (
    id_provincia: number,
  ): Promise<IRespuesta<RES_Distrito[]>> => {
    const { data } = await api.get<IRespuesta<RES_Distrito[]>>(
      `${path}/distritos`,
      {
        params: { id_provincia },
      },
    );
    return data;
  },
};
