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
import type { RES_Conductor } from "./responses/conductor";
import type { RES_TipoVehiculo } from "./responses/tipo-vehiculo";
import type { RES_EmpresaTransporte } from "./responses/empresa-transporte";
import type { RES_Vehiculo } from "./responses/vehiculo";
import type { RES_MotivoIngreso, RES_Visitante } from "./responses/auxiliar-visitas";
import type { EstadoBase } from "../shared/enums/_generic/estado-base";
import type { RES_Sucursal } from "./responses/sucursal";
import type { RES_ZonaOrigen } from "./responses/zona-origen";
import type { RES_EncargadoMuestraGlobal } from "./responses/encargado-muestra-global";

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

  get_conductores: async (): Promise<RES_Conductor[]> => {
    const { data } = await api.get(`${path}/conductores`);
    return data.data;
  },

  crear_conductor: async (payload: {
    dni: string;
    nombre: string;
    apellido: string;
    numero_licencia: string;
  }): Promise<RES_Conductor> => {
    const { data } = await api.post(`${path}/conductores`, payload);
    if (!data.success) {
      throw new Error(data.message || "Error al registrar conductor");
    }
    return data.data;
  },

  /**
   * Obtener lista de todos los tipos de vehículo registrados
   */
  get_tipos_vehiculo: async (): Promise<RES_TipoVehiculo[]> => {
    const { data } = await api.get(`${path}/tipos-vehiculo`);
    return data.data;
  },

  /**
   * Registrar un nuevo tipo de vehículo en el sistema
   */
  crear_tipo_vehiculo: async (
    nombre: string,
    tieneCarreta: boolean,
    esCarreta: boolean
  ): Promise<RES_TipoVehiculo> => {
    const { data } = await api.post(`${path}/tipos-vehiculo`, {
      nombre,
      tiene_carreta: tieneCarreta,
      es_carreta: esCarreta,
    });
    return data.data;
  },

  /**
   * Editar la información de un tipo de vehículo existente
   */
  editar_tipo_vehiculo: async (
    id: number,
    nombre: string,
    tieneCarreta: boolean,
    esCarreta: boolean
  ): Promise<RES_TipoVehiculo> => {
    const { data } = await api.put(`${path}/tipos-vehiculo/${id}`, {
      nombre,
      tiene_carreta: tieneCarreta,
      es_carreta: esCarreta,
    });
    return data.data;
  },

  /**
   * Cambiar el estado (Activo/Inactivo) de un tipo de vehículo
   */
  cambiar_estado_tipo_vehiculo: async (
    id: number,
    estado: EstadoBase
  ): Promise<RES_TipoVehiculo> => {
    const { data } = await api.patch(`${path}/tipos-vehiculo/${id}/estado`, { estado });
    return data.data;
  },

  /**
   * Obtener lista simplificada de empresas de transporte activas (para dropdowns)
   */
  get_empresas_transporte: async (): Promise<RES_EmpresaTransporte[]> => {
    const { data } = await api.get(`${path}/empresas-transporte`);
    return data.data;
  },

  /**
   * Obtener lista simplificada de vehículos (para dropdowns y búsquedas rápidas)
   */
  get_vehiculos: async (filters?: {
    serie?: string;
    numero_placa?: string;
  }): Promise<RES_Vehiculo[]> => {
    const { data } = await api.get(`${path}/vehiculos`, {
      params: filters,
    });
    return data.data;
  },

  /**
   * Registrar un vehículo de forma simplificada
   */
  crear_vehiculo: async (payload: {
    serie_placa: string | null;
    numero_placa: string;
    id_empresa_transporte: number;
    id_tipo_vehiculo: number;
  }): Promise<RES_Vehiculo> => {
    const { data } = await api.post(`${path}/vehiculos`, payload);
    return data.data;
  },

  /**
   * Editar un vehículo de forma simplificada
   */
  editar_vehiculo: async (
    id: number,
    payload: {
      id_empresa_transporte: number;
      id_tipo_vehiculo: number;
    }
  ): Promise<RES_Vehiculo> => {
    const { data } = await api.put(`${path}/vehiculos/${id}`, payload);
    return data.data;
  },

  /**
   * Obtener listado de motivos de ingreso
   */
  get_motivos_ingreso: async (): Promise<IRespuesta<RES_MotivoIngreso[]>> => {
    const { data } = await api.get<IRespuesta<RES_MotivoIngreso[]>>(
      `${path}/motivos-ingreso`
    );
    return data;
  },

  /**
   * Buscar visitante por DNI
   */
  buscar_visitante_por_dni: async (
    dni: string
  ): Promise<IRespuesta<RES_Visitante>> => {
    const { data } = await api.get<IRespuesta<RES_Visitante>>(
      `${path}/visitantes/buscar`,
      { params: { dni } }
    );
    return data;
  },

  /**
   * Crear un nuevo visitante
   */
  crear_visitante: async (payload: {
    nombre: string;
    apellido: string;
    dni: string;
    telefono: string | null;
  }): Promise<IRespuesta<RES_Visitante>> => {
    const { data } = await api.post<IRespuesta<RES_Visitante>>(
      `${path}/visitantes`,
      payload
    );
    return data;
  },

  get_sucursales: async (): Promise<RES_Sucursal[]> => {
    const { data } = await api.get(`${path}/sucursales`);
    return data.data;
  },

  get_zonas_origen: async (): Promise<RES_ZonaOrigen[]> => {
    const { data } = await api.get(`${path}/zonas-origen`);
    return data.data;
  },

  crear_zona_origen: async (payload: { nombre: string }): Promise<RES_ZonaOrigen> => {
    const { data } = await api.post(`${path}/zonas-origen`, payload);
    return data.data;
  },

  get_encargados_muestra: async (): Promise<RES_EncargadoMuestraGlobal[]> => {
    const { data } = await api.get(`${path}/encargados-muestra`);
    return data.data;
  },
};
