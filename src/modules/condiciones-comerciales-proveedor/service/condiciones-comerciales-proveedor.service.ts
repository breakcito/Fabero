import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type { RES_CondicionComercialProveedor } from "./condiciones-comerciales-proveedor.responses";
import type {
  DTO_CrearCondicionComercial,
  DTO_ActualizarCondicionComercial,
} from "./condiciones-comerciales-proveedor.requests";
import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";

const path = "/proveedores/condiciones-comerciales";

export const CondicionesComercialesProveedorService = {
  get_condiciones: async (
    id_proveedor_minero: number,
    estado?: EstadoBase | "Todos",
  ): Promise<IRespuesta<RES_CondicionComercialProveedor[]>> => {
    const { data } = await api.get<IRespuesta<RES_CondicionComercialProveedor[]>>(path, {
      params: { id_proveedor_minero, estado },
    });
    return data;
  },

  crear_condicion: async (
    payload: DTO_CrearCondicionComercial,
  ): Promise<IRespuesta<RES_CondicionComercialProveedor>> => {
    const { data } = await api.post<IRespuesta<RES_CondicionComercialProveedor>>(path, payload);
    return data;
  },

  actualizar_condicion: async (
    id: number,
    payload: DTO_ActualizarCondicionComercial,
  ): Promise<IRespuesta<RES_CondicionComercialProveedor>> => {
    const { data } = await api.put<IRespuesta<RES_CondicionComercialProveedor>>(`${path}/${id}`, payload);
    return data;
  },

  cambiar_estado: async (
    id: number,
    estado: EstadoBase,
  ): Promise<IRespuesta<RES_CondicionComercialProveedor>> => {
    const { data } = await api.patch<IRespuesta<RES_CondicionComercialProveedor>>(`${path}/${id}/estado`, { estado });
    return data;
  },
};
