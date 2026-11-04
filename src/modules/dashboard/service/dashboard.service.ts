import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type { DTO_DashboardFiltros } from "./dashboard.requests";
import type { RES_Dashboard } from "./dashboard.responses";

const PATH = "/dashboard/resumen";

export const DashboardService = {
  /**
   * Obtener el resumen de indicadores: evolución mensual de los últimos
   * 12 meses cerrados (con comparativo interanual) y fotografía actual de
   * planta y finanzas. Todo llega en una sola respuesta para evitar N+1.
   */
  get_resumen: async (
    filtros: DTO_DashboardFiltros = {},
  ): Promise<IRespuesta<RES_Dashboard>> => {
    const { data } = await api.get(PATH, { params: filtros });
    return data;
  },
};
