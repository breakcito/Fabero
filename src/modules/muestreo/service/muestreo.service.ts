import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type {
  DTO_ConfirmarMuestreo,
  FiltrosMuestreo,
} from "./muestreo.requests";
import type {
  RES_LoteMuestreo,
  RES_ParticionMuestreo,
} from "./muestreo.responses";

const PATH = "/muestreo";

/**
 * Desenvuelve la respuesta del backend.
 *
 * `ApiResponse::error()` del backend devuelve HTTP 200 con `success: false`;
 * sin este helper el frontend trataría cualquier 2xx como éxito.
 */
function unwrapApiResponse<T>(response: { data: unknown }): T {
  const body = response.data as IRespuesta<T> | null;

  if (body && typeof body === "object" && body.success === false) {
    throw new Error(body.message || "Error desconocido del backend");
  }

  if (body && typeof body === "object" && "data" in body) {
    return body.data;
  }

  return body as T;
}

export const MuestreoService = {
  /** Lotes pendientes de muestreo (con o sin particiones). */
  get_lotes: async (filtros: FiltrosMuestreo = {}): Promise<RES_LoteMuestreo[]> => {
    const response = await api.get(`${PATH}/lotes`, {
      params: {
        fecha_inicio: filtros.fecha_inicio ?? undefined,
        fecha_fin: filtros.fecha_fin ?? undefined,
      },
    });
    return unwrapApiResponse<RES_LoteMuestreo[]>(response);
  },

  /** Detalle de un lote pendiente de muestreo, con sus particiones. */
  get_lote: async (id: number): Promise<RES_LoteMuestreo> => {
    const response = await api.get(`${PATH}/lotes/${id}`);
    return unwrapApiResponse<RES_LoteMuestreo>(response);
  },

  /**
   * Confirma el muestreo del lote: define producto, tipo de mineral y
   * consolida el correlativo. Las particiones activas se confirman junto
   * con el padre y sus correlativos se realinean.
   */
  confirmar_muestreo: async (
    id: number,
    dto: DTO_ConfirmarMuestreo,
  ): Promise<{ lote: RES_LoteMuestreo; particiones: RES_ParticionMuestreo[] }> => {
    const body: DTO_ConfirmarMuestreo = { ...dto };
    if (dto.id_particion === undefined || dto.id_particion === null) {
      delete body.id_particion;
    }
    const response = await api.post(`${PATH}/lotes/${id}/confirmar`, body);
    return unwrapApiResponse<{
      lote: RES_LoteMuestreo;
      particiones: RES_ParticionMuestreo[];
    }>(response);
  },
};
