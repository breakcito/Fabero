import { api } from "../../../service/_api";

/**
 * Servicio para gestionar el modo auditoría en la API.
 */
export const ModoAuditoriaService = {
  /**
   * Cambia el estado del modo auditoría globalmente.
   */
  toggle: async (activo: boolean) => {
    const { data } = await api.post("/modo-auditoria/toggle", { activo });
    return data;
  },
};
