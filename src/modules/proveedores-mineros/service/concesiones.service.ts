import { api } from "../../../service/_api";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
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

  editar_concesion: async (
    idConcesion: number,
    dto: DTO_CrearConcesion,
  ): Promise<IRespuesta<RES_Concesion>> => {
    const { data } = await api.put(`${PATH}/${idConcesion}`, dto);
    return data;
  },
  cambiar_estado_concesion: async (
    idConcesion: number,
    estado: EstadoBase,
  ): Promise<IRespuesta<RES_Concesion>> => {
    const { data } = await api.patch(`${PATH}/${idConcesion}/estado`, { estado });
    return data;
  },
};
