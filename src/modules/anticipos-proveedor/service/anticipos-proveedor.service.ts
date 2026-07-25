import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type { DTO_CrearAnticipoProveedor } from "./anticipos-proveedor.requests";
import type { RES_AnticipoProveedor } from "./anticipos-proveedor.responses";

export const AnticiposProveedorService = {
  get_anticipos: async (filters?: {
    id_proveedor_minero?: number | null;
    estado?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
  }): Promise<IRespuesta<RES_AnticipoProveedor[]>> => {
    const params: Record<string, unknown> = {};
    if (filters?.id_proveedor_minero) {
      params.id_proveedor_minero = filters.id_proveedor_minero;
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

    const { data } = await api.get<IRespuesta<RES_AnticipoProveedor[]>>(
      "/anticipos-proveedor",
      { params }
    );
    return data;
  },

  crear_anticipo: async (
    dto: DTO_CrearAnticipoProveedor
  ): Promise<IRespuesta<RES_AnticipoProveedor>> => {
    const formData = new FormData();
    formData.append("id_proveedor_minero", String(dto.id_proveedor_minero));
    if (dto.serie_factura) {
      formData.append("serie_factura", dto.serie_factura);
    }
    if (dto.numero_factura) {
      formData.append("numero_factura", dto.numero_factura);
    }
    formData.append("saldo_inicial", String(dto.saldo_inicial));

    if (dto.evidencias && dto.evidencias.length > 0) {
      for (const file of dto.evidencias) {
        formData.append("evidencias[]", file);
      }
    }

    const { data } = await api.post<IRespuesta<RES_AnticipoProveedor>>(
      "/anticipos-proveedor",
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
  ): Promise<IRespuesta<RES_AnticipoProveedor>> => {
    const { data } = await api.patch<IRespuesta<RES_AnticipoProveedor>>(
      `/anticipos-proveedor/${id}/anular`,
      { motivo }
    );
    return data;
  },

  get_transacciones: async (
    id: number
  ): Promise<IRespuesta<import("./anticipos-proveedor.responses").RES_TransaccionAnticipo[]>> => {
    const { data } = await api.get<
      IRespuesta<import("./anticipos-proveedor.responses").RES_TransaccionAnticipo[]>
    >(`/anticipos-proveedor/${id}/transacciones`);
    return data;
  },

  get_historial_combinado: async (
    id: number
  ): Promise<IRespuesta<import("../../../service/responses/_generic/cambios-log").RES_CambiosLog[]>> => {
    const { data } = await api.get<
      IRespuesta<import("../../../service/responses/_generic/cambios-log").RES_CambiosLog[]>
    >(`/anticipos-proveedor/${id}/historial-cambios`);
    return data;
  },
};
