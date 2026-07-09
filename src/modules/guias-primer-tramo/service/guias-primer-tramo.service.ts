import { api } from "../../../service/_api";
import type { DTO_CrearGuiaPrimerTramo, DTO_ActualizarGuiaPrimerTramo } from "./guias-primer-tramo.requests";
import type {
  RES_ConcesionPorProveedor,
  RES_FiltrosMetadataGuia,
  RES_GuiaPrimerTramo,
  RES_LoteMineralDisponible,
} from "./guias-primer-tramo.responses";

const PATH = "/guias-primer-tramo";

export const GuiasPrimerTramoService = {
  /**
   * Listar guías filtradas por sucursal.
   */
  get_guias: async (filters: {
    id_sucursal: number;
    id_proveedor?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    guia_remitente?: string;
  }): Promise<RES_GuiaPrimerTramo[]> => {
    const { data } = await api.get(PATH, { params: filters });
    return data.data;
  },

  /**
   * Obtener una guía por id.
   */
  get_guia_by_id: async (id: number): Promise<RES_GuiaPrimerTramo> => {
    const { data } = await api.get(`${PATH}/${id}`);
    return data.data;
  },

  /**
   * Obtener metadatos para los filtros.
   */
  get_filtros_metadata: async (
    idSucursal: number,
  ): Promise<RES_FiltrosMetadataGuia> => {
    const { data } = await api.get(`${PATH}/filtros-metadata`, {
      params: { id_sucursal: idSucursal },
    });
    return data.data;
  },

  /**
   * Crear una guía de primer tramo (multipart con evidencias + lotes JSON).
   */
  crear_guia: async (dto: DTO_CrearGuiaPrimerTramo): Promise<RES_GuiaPrimerTramo> => {
    const formData = new FormData();

    formData.append("id_sucursal", String(dto.id_sucursal));
    formData.append("id_proveedor", String(dto.id_proveedor));
    formData.append("id_concesion", String(dto.id_concesion));
    formData.append("id_conductor", String(dto.id_conductor));
    formData.append("id_vehiculo", String(dto.id_vehiculo));

    if (dto.id_empresa_transporte !== null && dto.id_empresa_transporte !== undefined) {
      formData.append("id_empresa_transporte", String(dto.id_empresa_transporte));
    }
    if (
      dto.id_vehiculo_carreta !== null &&
      dto.id_vehiculo_carreta !== undefined
    ) {
      formData.append("id_vehiculo_carreta", String(dto.id_vehiculo_carreta));
    }
    if (
      dto.id_empresa_transporte_carreta !== null &&
      dto.id_empresa_transporte_carreta !== undefined
    ) {
      formData.append("id_empresa_transporte_carreta", String(dto.id_empresa_transporte_carreta));
    }

    formData.append("motivo_traslado", String(dto.motivo_traslado));

    if (dto.fecha_inicio_traslado) {
      formData.append("fecha_inicio_traslado", dto.fecha_inicio_traslado);
    }
    if (dto.fecha_emision) {
      formData.append("fecha_emision", dto.fecha_emision);
    }
    if (dto.fecha_en_planta) {
      formData.append("fecha_en_planta", dto.fecha_en_planta);
    }

    if (dto.serie_guia_remitente) {
      formData.append("serie_guia_remitente", dto.serie_guia_remitente);
    }
    if (dto.numero_guia_remitente) {
      formData.append("numero_guia_remitente", dto.numero_guia_remitente);
    }
    if (dto.serie_guia_transportista) {
      formData.append("serie_guia_transportista", dto.serie_guia_transportista);
    }
    if (dto.numero_guia_transportista) {
      formData.append("numero_guia_transportista", dto.numero_guia_transportista);
    }
    formData.append("sin_guia_transportista", dto.sin_guia_transportista ? "1" : "0");

    formData.append("lotes", JSON.stringify(dto.lotes));

    dto.evidencias.forEach((file) => {
      formData.append("evidencias[]", file);
    });

    const { data } = await api.post(PATH, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  /**
   * Actualizar una guía de primer tramo (multipart con evidencias + lotes JSON).
   */
  actualizar_guia: async (
    id: number,
    dto: DTO_ActualizarGuiaPrimerTramo,
  ): Promise<RES_GuiaPrimerTramo> => {
    const formData = new FormData();

    formData.append("id_sucursal", String(dto.id_sucursal));
    formData.append("id_proveedor", String(dto.id_proveedor));
    formData.append("id_concesion", String(dto.id_concesion));
    formData.append("id_conductor", String(dto.id_conductor));
    formData.append("id_vehiculo", String(dto.id_vehiculo));

    if (dto.id_empresa_transporte !== null && dto.id_empresa_transporte !== undefined) {
      formData.append("id_empresa_transporte", String(dto.id_empresa_transporte));
    }
    if (
      dto.id_vehiculo_carreta !== null &&
      dto.id_vehiculo_carreta !== undefined
    ) {
      formData.append("id_vehiculo_carreta", String(dto.id_vehiculo_carreta));
    }
    if (
      dto.id_empresa_transporte_carreta !== null &&
      dto.id_empresa_transporte_carreta !== undefined
    ) {
      formData.append("id_empresa_transporte_carreta", String(dto.id_empresa_transporte_carreta));
    }

    formData.append("motivo_traslado", String(dto.motivo_traslado));

    if (dto.fecha_inicio_traslado) {
      formData.append("fecha_inicio_traslado", dto.fecha_inicio_traslado);
    }
    if (dto.fecha_emision) {
      formData.append("fecha_emision", dto.fecha_emision);
    }
    if (dto.fecha_en_planta) {
      formData.append("fecha_en_planta", dto.fecha_en_planta);
    }

    if (dto.serie_guia_remitente) {
      formData.append("serie_guia_remitente", dto.serie_guia_remitente);
    }
    if (dto.numero_guia_remitente) {
      formData.append("numero_guia_remitente", dto.numero_guia_remitente);
    }
    if (dto.serie_guia_transportista) {
      formData.append("serie_guia_transportista", dto.serie_guia_transportista);
    }
    if (dto.numero_guia_transportista) {
      formData.append("numero_guia_transportista", dto.numero_guia_transportista);
    }
    formData.append("sin_guia_transportista", dto.sin_guia_transportista ? "1" : "0");

    formData.append("lotes", JSON.stringify(dto.lotes));

    if (dto.evidencias_existentes) {
      formData.append("evidencias_existentes", JSON.stringify(dto.evidencias_existentes));
    }

    dto.evidencias.forEach((file) => {
      formData.append("evidencias[]", file);
    });

    const { data } = await api.post(`${PATH}/${id}/update`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  /**
   * Anular una guía de primer tramo.
   */
  anular_guia: async (id: number): Promise<void> => {
    await api.patch(`${PATH}/${id}/anular`);
  },
};

/**
 * Servicio auxiliar para lotes minerales disponibles.
 */
export const LotesMineralService = {
  get_lotes_disponibles: async (
    idSucursal: number,
    idProveedor?: number | null,
  ): Promise<RES_LoteMineralDisponible[]> => {
    const { data } = await api.get(`/aux/lotes-mineral-disponibles`, {
      params: { id_sucursal: idSucursal, id_proveedor: idProveedor ?? undefined },
    });
    return data.data;
  },
};

/**
 * Servicio auxiliar para concesiones por proveedor.
 */
export const ConcesionesPorProveedorService = {
  get_concesiones_by_proveedor: async (
    idProveedor: number,
  ): Promise<RES_ConcesionPorProveedor[]> => {
    const { data } = await api.get(`/concesiones/por-proveedor`, {
      params: { id_proveedor: idProveedor },
    });
    return data.data;
  },
};