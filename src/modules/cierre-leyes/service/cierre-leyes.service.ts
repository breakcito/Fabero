import { api } from "../../../service/_api";
import type { LoteSugeridoResponse, LoteCierreResponse } from "./cierre-leyes.responses";
import type { GuardarValorPayload, FiltrosLotesSugeridos } from "./cierre-leyes.requests";
import { TipoOrigen } from "../../../shared/enums/_generic/tipo-origen";

export type { GuardarValorPayload, FiltrosLotesSugeridos };
export type {
  IniciarLotePayload,
  ConfirmarLotePayload,
  ActualizarOrigenFilaPayload,
} from "./cierre-leyes.requests";

export const CierreLeyesService = {
  getLotesSugeridos: async (filtros?: FiltrosLotesSugeridos): Promise<LoteSugeridoResponse[]> => {
    const params = new URLSearchParams();
    if (filtros?.estado && filtros.estado !== "Todos") {
      params.append("estado", filtros.estado);
    }
    if (filtros?.fechaInicio) {
      params.append("fecha_inicio", filtros.fechaInicio);
    }
    if (filtros?.fechaFin) {
      params.append("fecha_fin", filtros.fechaFin);
    }
    const qs = params.toString();
    const url = qs ? `/cierre-leyes/lotes-sugeridos?${qs}` : "/cierre-leyes/lotes-sugeridos";
    const { data } = await api.get(url);
    return data.data;
  },

  iniciarLote: async (idLoteMineral: number): Promise<LoteCierreResponse> => {
    const { data } = await api.post("/cierre-leyes/lotes/iniciar", { id_lote_mineral: idLoteMineral });
    return data.data;
  },

  getLotesCierre: async (filtros?: FiltrosLotesSugeridos): Promise<LoteCierreResponse[]> => {
    const params = new URLSearchParams();
    if (filtros?.estado && filtros.estado !== "Todos") {
      params.append("estado", filtros.estado);
    }
    if (filtros?.fechaInicio) {
      params.append("fecha_inicio", filtros.fechaInicio);
    }
    if (filtros?.fechaFin) {
      params.append("fecha_fin", filtros.fechaFin);
    }
    const qs = params.toString();
    const url = qs ? `/cierre-leyes/lotes?${qs}` : "/cierre-leyes/lotes";
    const { data } = await api.get(url);
    return data.data;
  },

  guardarValorLey: async (payload: GuardarValorPayload): Promise<LoteCierreResponse> => {
    const { data } = await api.post("/cierre-leyes/guardar-valor", payload);
    return data.data;
  },

  eliminarValorLey: async (id: number): Promise<LoteCierreResponse> => {
    const { data } = await api.delete(`/cierre-leyes/valores/${id}`);
    return data.data;
  },

  eliminarFila: async (idLoteMineral: number, uuidFila: string): Promise<LoteCierreResponse> => {
    const { data } = await api.delete(`/cierre-leyes/lotes/${idLoteMineral}/filas/${uuidFila}`);
    return data.data;
  },

  confirmarLoteLeyes: async (idLoteMineral: number, conValorComercial: boolean): Promise<LoteCierreResponse> => {
    const { data } = await api.post("/cierre-leyes/lotes/confirmar", {
      id_lote_mineral: idLoteMineral,
      con_valor_comercial: conValorComercial,
    });
    return data.data;
  },

  actualizarOrigenFila: async (idLoteMineral: number, uuidFila: string, tipoOrigen: TipoOrigen | null): Promise<LoteCierreResponse> => {
    const { data } = await api.put(`/cierre-leyes/lotes/${idLoteMineral}/filas/${uuidFila}/origen`, {
      tipo_origen: tipoOrigen ?? null,
    });
    return data.data;
  },

  agregarAnalisis: async (idLoteMineral: number): Promise<LoteCierreResponse> => {
    const { data } = await api.post(`/cierre-leyes/lotes/${idLoteMineral}/analisis`);
    return data.data;
  },
};
