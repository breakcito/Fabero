import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type { DTO_DashboardFiltros } from "./dashboard.requests";
import type { RES_Dashboard } from "./dashboard.responses";

const PATH = "/dashboard/indicadores";

export const DashboardService = {
  /**
   * Obtener el paquete completo de indicadores y métricas del dashboard.
   * Todo llega en una sola respuesta para evitar N+1 desde el frontend.
   */
  get_indicadores: async (
    filtros: DTO_DashboardFiltros,
  ): Promise<IRespuesta<RES_Dashboard>> => {
    const { data } = await api.get(PATH, { params: filtros });
    return data;
  },
};
