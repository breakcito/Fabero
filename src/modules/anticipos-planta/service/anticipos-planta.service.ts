import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type { DTO_CrearAnticipoPlanta } from "./anticipos-planta.requests";
import type { RES_AnticipoPlanta } from "./anticipos-planta.responses";

export const AnticiposPlantaService = {
  get_anticipos: async (filters?: {
    id_planta?: number | null;
    estado?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
  }): Promise<IRespuesta<RES_AnticipoPlanta[]>> => {
    const params: Record<string, unknown> = {};
    if (filters?.id_planta) {
      params.id_planta = filters.id_planta;
    }
    if (filters?.estado) {
      params.estado = filters.estado;
    }
    if (filters?.fecha_inicio) {
      params.fecha_inicio = filters.fecha_inicio;
    }
    if (filters?.fecha_fin) {
      params.fecha_fin = filters.fecha_fin;
    }

    const { data } = await api.get<IRespuesta<RES_AnticipoPlanta[]>>(
      "/anticipos-planta",
      { params }
    );
    return data;
  },

  get_anticipo_by_id: async (
    id: number
  ): Promise<IRespuesta<RES_AnticipoPlanta>> => {
    const { data } = await api.get<IRespuesta<RES_AnticipoPlanta>>(
      `/anticipos-planta/${id}`
    );
    return data;
  },

  crear_anticipo: async (
    dto: DTO_CrearAnticipoPlanta
  ): Promise<IRespuesta<RES_AnticipoPlanta>> => {
    const formData = new FormData();
    formData.append("id_planta", String(dto.id_planta));
    if (dto.codigo_comprobante) {
      formData.append("codigo_comprobante", dto.codigo_comprobante);
    }
    formData.append("saldo_inicial", String(dto.saldo_inicial));

    if (dto.evidencias && dto.evidencias.length > 0) {
      for (const file of dto.evidencias) {
        formData.append("evidencias[]", file);
      }
    }

    const { data } = await api.post<IRespuesta<RES_AnticipoPlanta>>(
      "/anticipos-planta",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  },

  anular_anticipo: async (
    id: number,
    motivo: string
  ): Promise<IRespuesta<RES_AnticipoPlanta>> => {
    const { data } = await api.patch<IRespuesta<RES_AnticipoPlanta>>(
      `/anticipos-planta/${id}/anular`,
      { motivo }
    );
    return data;
  },
};
