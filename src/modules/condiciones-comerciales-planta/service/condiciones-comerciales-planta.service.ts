import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type { RES_CondicionComercialPlanta } from "./condiciones-comerciales-planta.responses";
import type {
  DTO_CrearCondicionComercialPlanta,
  DTO_ActualizarCondicionComercialPlanta,
} from "./condiciones-comerciales-planta.requests";
import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";

const path = "/plantas-destino/condiciones-comerciales";

export const CondicionesComercialesPlantaService = {
  get_condiciones: async (
    id_planta: number,
    estado?: EstadoBase | "Todos",
  ): Promise<IRespuesta<RES_CondicionComercialPlanta[]>> => {
    const { data } = await api.get<IRespuesta<RES_CondicionComercialPlanta[]>>(path, {
      params: { id_planta, estado },
    });
    return data;
  },

  crear_condicion: async (
    payload: DTO_CrearCondicionComercialPlanta,
  ): Promise<IRespuesta<RES_CondicionComercialPlanta>> => {
    const { data } = await api.post<IRespuesta<RES_CondicionComercialPlanta>>(path, payload);
    return data;
  },

  actualizar_condicion: async (
    id: number,
    payload: DTO_ActualizarCondicionComercialPlanta,
  ): Promise<IRespuesta<RES_CondicionComercialPlanta>> => {
    const { data } = await api.put<IRespuesta<RES_CondicionComercialPlanta>>(`${path}/${id}`, payload);
    return data;
  },

  cambiar_estado: async (
    id: number,
    estado: EstadoBase,
  ): Promise<IRespuesta<RES_CondicionComercialPlanta>> => {
    const { data } = await api.patch<IRespuesta<RES_CondicionComercialPlanta>>(`${path}/${id}/estado`, { estado });
    return data;
  },
};
