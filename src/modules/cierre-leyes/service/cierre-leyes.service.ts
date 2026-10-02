import { api } from "../../../service/_api";
import type { LoteSugeridoResponse, LoteCierreResponse, MuestraExternaResponse, MuestraAsociadaResponse, AsociarMuestraResponse } from "./cierre-leyes.responses";
import type { GuardarValorPayload, GuardarValorMuestraPayload, FiltrosLotesSugeridos } from "./cierre-leyes.requests";
import { TipoOrigen } from "../../../shared/enums/_generic/tipo-origen";

export type { GuardarValorPayload, GuardarValorMuestraPayload, FiltrosLotesSugeridos };
export type {
  IniciarLotePayload,
  IniciarMuestraPayload,
  ConfirmarLotePayload,
  AsociarMuestraPayload,
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

  confirmarLoteLeyes: async (
    idLoteMineral: number,
    conValorComercial: boolean,
    leyesManuales?: Array<{ id_grupo_analisis_detalle: number; ley: number }>,
  ): Promise<LoteCierreResponse> => {
    const { data } = await api.post("/cierre-leyes/lotes/confirmar", {
      id_lote_mineral: idLoteMineral,
      con_valor_comercial: conValorComercial,
      leyes_manuales: leyesManuales ?? null,
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

  // ===== Muestras externas =====

  iniciarMuestraExterna: async (idProveedorMinero: number): Promise<MuestraExternaResponse> => {
    const { data } = await api.post("/cierre-leyes/muestras-externas/iniciar", {
      id_proveedor_minero: idProveedorMinero,
    });
    return data.data;
  },

  getMuestrasExternas: async (): Promise<MuestraExternaResponse[]> => {
    const { data } = await api.get("/cierre-leyes/muestras-externas");
    return data.data;
  },

  guardarValorMuestraExterna: async (payload: GuardarValorMuestraPayload): Promise<MuestraExternaResponse> => {
    const { data } = await api.post("/cierre-leyes/muestras-externas/guardar-valor", payload);
    return data.data;
  },

  eliminarFilaMuestraExterna: async (idMuestraExterna: number, uuidFila: string): Promise<MuestraExternaResponse> => {
    const { data } = await api.delete(`/cierre-leyes/muestras-externas/${idMuestraExterna}/filas/${uuidFila}`);
    return data.data;
  },

  agregarAnalisisMuestra: async (idMuestraExterna: number): Promise<MuestraExternaResponse> => {
    const { data } = await api.post(`/cierre-leyes/muestras-externas/${idMuestraExterna}/analisis`);
    return data.data;
  },

  actualizarOrigenFilaMuestraExterna: async (
    idMuestraExterna: number,
    uuidFila: string,
    tipoOrigen: TipoOrigen | null,
  ): Promise<MuestraExternaResponse> => {
    const { data } = await api.put(`/cierre-leyes/muestras-externas/${idMuestraExterna}/filas/${uuidFila}/origen`, {
      tipo_origen: tipoOrigen ?? null,
    });
    return data.data;
  },

  asociarMuestraALote: async (idMuestraExterna: number, idLoteMineral: number): Promise<AsociarMuestraResponse> => {
    const { data } = await api.post(`/cierre-leyes/muestras-externas/${idMuestraExterna}/asociar`, {
      id_lote_mineral: idLoteMineral,
    });
    return data.data;
  },

  getMuestrasAsociadasPorLote: async (idLoteMineral: number): Promise<MuestraAsociadaResponse[]> => {
    const { data } = await api.get(`/cierre-leyes/muestras-externas/asociadas-por-lote`, {
      params: { id_lote_mineral: idLoteMineral },
    });
    return data.data;
  },
};
