import { api } from "../../../service/_api";
import type { RES_HistorialItem } from "./guias-primer-tramo.historial.responses";

const PATH = "/guias-primer-tramo";

/**
 * Servicio dedicado al historial de cambios de guías de primer tramo.
 * Sigue el patrón `service.ts` del módulo.
 */
export const GuiasPrimerTramoHistorialService = {
  /**
   * Obtiene el historial cronológico (DESC) unificando cabecera + lotes para una guía.
   */
  get_historial: async (idGuia: number): Promise<RES_HistorialItem[]> => {
    const { data } = await api.get(`${PATH}/${idGuia}/historial`);
    return data.data;
  },
};
