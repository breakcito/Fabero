import { api } from "../../../service/_api";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type { AnalitoResponse, GrupoAnalisisResponse } from "./gestion-leyes.responses";
import type { CrearGrupoPayload } from "./gestion-leyes.requests";

export type { AnalitoResponse, GrupoAnalisisDetalleResponse, GrupoAnalisisResponse } from "./gestion-leyes.responses";
export type { CrearGrupoPayload } from "./gestion-leyes.requests";

export const GestionLeyesService = {
  getGrupos: async (): Promise<GrupoAnalisisResponse[]> => {
    const { data } = await api.get("/gestion-leyes/grupos");
    return data.data;
  },

  crearGrupo: async (payload: CrearGrupoPayload): Promise<GrupoAnalisisResponse> => {
    const { data } = await api.post("/gestion-leyes/grupos", payload);
    return data.data;
  },

  editarGrupo: async (id: number, payload: CrearGrupoPayload): Promise<GrupoAnalisisResponse> => {
    const { data } = await api.put(`/gestion-leyes/grupos/${id}`, payload);
    return data.data;
  },

  cambiarEstadoGrupo: async (id: number, estado: EstadoBase): Promise<GrupoAnalisisResponse> => {
    const { data } = await api.patch(`/gestion-leyes/grupos/${id}/estado`, { estado });
    return data.data;
  },

  getAnalitos: async (): Promise<AnalitoResponse[]> => {
    const { data } = await api.get("/gestion-leyes/analitos");
    return data.data;
  },

  crearAnalito: async (nombre: string, esDesplegable: boolean): Promise<AnalitoResponse> => {
    const { data } = await api.post("/gestion-leyes/analitos", { nombre, es_desplegable: esDesplegable });
    return data.data;
  },

  cambiarEstadoAnalito: async (id: number, estado: EstadoBase): Promise<AnalitoResponse> => {
    const { data } = await api.patch(`/gestion-leyes/analitos/${id}/estado`, { estado });
    return data.data;
  },

  editarAnalito: async (id: number, nombre: string, esDesplegable: boolean): Promise<AnalitoResponse> => {
    const { data } = await api.put(`/gestion-leyes/analitos/${id}`, { nombre, es_desplegable: esDesplegable });
    return data.data;
  },
};
