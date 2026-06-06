import { api } from "../../../service/_api";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type { DTO_CrearEncargadoMuestra } from "./encargados-muestra.requests";
import type { RES_EncargadoMuestra } from "./encargados-muestra.responses";

const PATH = "/encargados-muestra";

export const EncargadosMuestraService = {
  get_encargados_muestra: async (): Promise<IRespuesta<RES_EncargadoMuestra[]>> => {
    const { data } = await api.get(PATH);
    return data;
  },

  crear_encargado_muestra: async (
    dto: DTO_CrearEncargadoMuestra,
  ): Promise<IRespuesta<RES_EncargadoMuestra>> => {
    const { data } = await api.post(PATH, dto);
    return data;
  },

  editar_encargado_muestra: async (
    idEncargadoMuestra: number,
    dto: DTO_CrearEncargadoMuestra,
  ): Promise<IRespuesta<RES_EncargadoMuestra>> => {
    const { data } = await api.put(`${PATH}/${idEncargadoMuestra}`, dto);
    return data;
  },

  cambiar_estado_encargado_muestra: async (
    idEncargadoMuestra: number,
    estado: EstadoBase,
  ): Promise<IRespuesta<RES_EncargadoMuestra>> => {
    const { data } = await api.patch(`${PATH}/${idEncargadoMuestra}/estado`, { estado });
    return data;
  },
};
