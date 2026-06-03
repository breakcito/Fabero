import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type {
  DTO_CrearConcesion,
} from "../../proveedores-mineros/service/concesiones.requests";
import type { RES_Concesion } from "../../proveedores-mineros/service/concesiones.responses";

const PATH = "/concesiones";

export const ConcesionesService = {
  get_concesiones: async (): Promise<IRespuesta<RES_Concesion[]>> => {
    const { data } = await api.get(PATH);
    return data;
  },

  crear_concesion: async (
    dto: DTO_CrearConcesion,
  ): Promise<IRespuesta<RES_Concesion>> => {
    const { data } = await api.post(PATH, dto);
    return data;
  },
};
