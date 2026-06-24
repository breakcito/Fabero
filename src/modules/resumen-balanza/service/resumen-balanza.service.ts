import { api } from "../../../service/_api";
import type { DTO_ResumenBalanzaFiltros } from "./resumen-balanza.requests";
import type { RES_ResumenBalanzaItem, RES_ResumenBalanzaFiltrosMetadata } from "./resumen-balanza.responses";

const PATH = "/recepcion-mineral/resumen";

export const ResumenBalanzaService = {
  /**
   * Obtener listado de resumen de balanza filtrado
   */
  get_resumen_balanza: async (
    filters: DTO_ResumenBalanzaFiltros
  ): Promise<RES_ResumenBalanzaItem[]> => {
    const { data } = await api.get(PATH, {
      params: filters,
    });
    return data.data;
  },

  /**
   * Obtener metadatos únicos para los filtros de resumen
   */
  get_resumen_filtros: async (
    idSucursal: number
  ): Promise<RES_ResumenBalanzaFiltrosMetadata> => {
    const { data } = await api.get(`${PATH}/filtros`, {
      params: { id_sucursal: idSucursal },
    });
    return data.data;
  },
};
