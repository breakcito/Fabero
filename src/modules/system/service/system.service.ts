import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type { DTO_Nodo, DTO_Modulo } from "./menu.requests";
import type { RES_MenuArbol, RES_Nodo } from "./menu.responses";

export class SystemService {
  private static PATH = "/system";

  // ------------------------------------------------------------------
  // Arbol de navegacion (menu -> submenu -> modulo)
  // ------------------------------------------------------------------
  static get_menu_arbol = async (): Promise<IRespuesta<RES_MenuArbol[]>> => {
    const { data } = await api.get(`${this.PATH}/menu-arbol`);
    return data;
  };

  static crear_menu = async (dto: DTO_Nodo): Promise<IRespuesta<RES_Nodo>> => {
    const { data } = await api.post(`${this.PATH}/menu`, dto);
    return data;
  };
  static editar_menu = async (
    id: number,
    dto: DTO_Nodo,
  ): Promise<IRespuesta<null>> => {
    const { data } = await api.put(`${this.PATH}/menu/${id}`, dto);
    return data;
  };
  static eliminar_menu = async (id: number): Promise<IRespuesta<null>> => {
    const { data } = await api.delete(`${this.PATH}/menu/${id}`);
    return data;
  };

  static crear_submenu = async (
    dto: DTO_Nodo & { id_menu: number },
  ): Promise<IRespuesta<RES_Nodo>> => {
    const { data } = await api.post(`${this.PATH}/submenu`, dto);
    return data;
  };
  static editar_submenu = async (
    id: number,
    dto: DTO_Nodo,
  ): Promise<IRespuesta<null>> => {
    const { data } = await api.put(`${this.PATH}/submenu/${id}`, dto);
    return data;
  };
  static eliminar_submenu = async (id: number): Promise<IRespuesta<null>> => {
    const { data } = await api.delete(`${this.PATH}/submenu/${id}`);
    return data;
  };

  static crear_modulo = async (
    dto: DTO_Modulo,
  ): Promise<IRespuesta<RES_Nodo>> => {
    const { data } = await api.post(`${this.PATH}/modulo`, dto);
    return data;
  };
  static editar_modulo = async (
    id: number,
    dto: DTO_Modulo,
  ): Promise<IRespuesta<null>> => {
    const { data } = await api.put(`${this.PATH}/modulo/${id}`, dto);
    return data;
  };
  static eliminar_modulo = async (id: number): Promise<IRespuesta<null>> => {
    const { data } = await api.delete(`${this.PATH}/modulo/${id}`);
    return data;
  };
}
