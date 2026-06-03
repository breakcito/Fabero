import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type {
  DTO_RegistroArea,
  DTO_RegistroCargo,
} from "./organigrama.requests";
import type { RES_Area, RES_Cargo } from "./organigrama.responses";

const PATH = "/organigrama";

export const OrganigramaService = {
  // ÁREAS
  get_areas: async (): Promise<IRespuesta<RES_Area[]>> => {
    const { data } = await api.get(`${PATH}/areas`);
    return data;
  },

  crear_area: async (dto: DTO_RegistroArea): Promise<IRespuesta<RES_Area>> => {
    const { data } = await api.post(`${PATH}/areas`, dto);
    return data;
  },

  // CARGOS
  get_cargos: async (id_area: number): Promise<IRespuesta<RES_Cargo[]>> => {
    const { data } = await api.get(`${PATH}/cargos/${id_area}`);
    return data;
  },

  crear_cargo: async (
    dto: DTO_RegistroCargo,
  ): Promise<IRespuesta<RES_Cargo>> => {
    const { data } = await api.post(`${PATH}/cargos`, dto);
    return data;
  },

  cambiar_estado_cargo: async (id_cargo: number): Promise<IRespuesta<null>> => {
    const { data } = await api.patch(`${PATH}/cargos/${id_cargo}/estado`);
    return data;
  },
};
