import { api } from "../../../service/_api";
import type {
  DTO_PesoInicial,
  DTO_PesoFinal,
  DTO_CrearLote,
  DTO_CrearParticion,
  DTO_UpdateCamposNoPeso,
  DTO_PesoInicialParticion,
  DTO_PesoFinalParticion,
} from "./recepcion-mineral.requests";
import type {
  RecepcionMineralResponse,
  RES_LoteMineral,
  RES_ParticionBalanza,
  RES_LotePadreParticionado,
} from "./recepcion-mineral.responses";
import type { RES_TicketBalanzaData } from "../../../service/responses/ticket-balanza";

const PATH = "/recepcion-mineral";

/**
 * Helper: añade un campo al FormData solo si tiene valor real (no null,
 * no undefined, no string vacío). Evita enviar basura al backend que luego
 * podría sobrescribir datos del lote padre con null.
 */
function appendIfPresent(formData: FormData, key: string, value: unknown): void {
  if (value === null || value === undefined) return;
  if (typeof value === "string" && value.trim() === "") return;
  formData.append(key, String(value));
}

/**
 * Helper: desempaca la respuesta de axios validando la estructura estándar del
 * backend (`{success: bool, data: T, message?: string, errors?: any}`).
 *
 * - Si `success === false`, lanza un Error con `message` (entra al catch del
 *   caller → `notifyError` lo muestra al usuario).
 * - Si `success === true` (o la respuesta no tiene la estructura esperada por
 *   compatibilidad legacy), retorna el payload de `data`.
 *
 * Bug crítico que arregla: el backend `response()->json(ApiResponse::error(...))`
 * siempre retorna HTTP 200 aunque el body diga `success: false`. Sin este helper,
 * el frontend trataba cualquier 2xx como éxito y mostraba un toast verde
 * engañoso (ej. al intentar `finalizar_particion_lote` con validaciones pendientes).
 */
function unwrapApiResponse<T>(response: { data: unknown }): T {
  const body = response.data;
  console.log("[unwrapApiResponse] body recibido:", body);
  if (
    body !== null &&
    typeof body === "object" &&
    "success" in body &&
    (body as { success: unknown }).success === false
  ) {
    const message =
      (body as { message?: string }).message ??
      "Error desconocido del backend";
    console.error("[unwrapApiResponse] success=false, lanzando error:", message);
    throw new Error(message);
  }
  if (body !== null && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  console.log("[unwrapApiResponse] body sin estructura {success,data}, retornando body crudo");
  return body as T;
}

export const RecepcionMineralService = {
  /**
   * Obtener recepciones de mineral filtradas por sucursal y estado de pesaje
   */
  get_recepciones_mineral: async (
    idSucursal: number,
    estadoPesaje?: string
  ): Promise<RecepcionMineralResponse[]> => {
    const response = await api.get(PATH, {
      params: { id_sucursal: idSucursal, estado_pesaje: estadoPesaje },
    });
    return unwrapApiResponse<RecepcionMineralResponse[]>(response);
  },

  /**
   * Iniciar proceso de pesaje para una unidad
   */
  iniciar_pesaje: async (id: number): Promise<RecepcionMineralResponse> => {
    const response = await api.put(`${PATH}/${id}/iniciar`);
    return unwrapApiResponse<RecepcionMineralResponse>(response);
  },

  /**
   * Validar y actualizar un campo específico paso a paso (datos de la unidad)
   */
  validar_campo: async (
    id: number,
    field: string,
    value: unknown
  ): Promise<RecepcionMineralResponse> => {
    const response = await api.put(`${PATH}/${id}/validar`, { field, value });
    return unwrapApiResponse<RecepcionMineralResponse>(response);
  },

  crear_lote: async (
    id: number,
    dto: DTO_CrearLote,
  ): Promise<RES_LoteMineral> => {
    const body: DTO_CrearLote = {
      condicion_ingreso: dto.condicion_ingreso,
      id_empresa: dto.id_empresa,
      con_codigo_manual: dto.con_codigo_manual,
      particionar: dto.particionar ?? false,
    };
    if (dto.con_codigo_manual && dto.codigo_manual) {
      body.codigo_manual = dto.codigo_manual;
    }
    const response = await api.post(`${PATH}/${id}/lotes`, body);
    return unwrapApiResponse<RES_LoteMineral>(response);
  },

  /**
   * Eliminar un lote vacío o incompleto
   */
  eliminar_lote: async (loteId: number): Promise<void> => {
    const response = await api.delete(`${PATH}/lotes/${loteId}`);
    unwrapApiResponse<unknown>(response);
  },

  /**
   * Registrar peso inicial de un lote (con subida de evidencias)
   */
  registrar_peso_inicial: async (
    loteId: number,
    dto: DTO_PesoInicial
  ): Promise<RES_LoteMineral> => {
    const formData = new FormData();
    if (dto.id_proveedor_minero !== null && dto.id_proveedor_minero !== undefined) {
      formData.append("id_proveedor_minero", String(dto.id_proveedor_minero));
    }
    if (dto.id_zona_origen !== null && dto.id_zona_origen !== undefined) {
      formData.append("id_zona_origen", String(dto.id_zona_origen));
    }
    formData.append("numero_contacto", dto.numero_contacto || "");
    if (dto.tipo_producto !== null && dto.tipo_producto !== undefined) {
      formData.append("tipo_producto", dto.tipo_producto);
    }
    if (dto.tipo_mineral !== null && dto.tipo_mineral !== undefined) {
      formData.append("tipo_mineral", dto.tipo_mineral);
    }
    formData.append("peso_inicial", String(dto.peso_inicial));

    if (dto.evidencias && dto.evidencias.length > 0) {
      dto.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }

    const response = await api.post(`${PATH}/lotes/${loteId}/peso-inicial`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return unwrapApiResponse<RES_LoteMineral>(response);
  },

  /**
   * Registrar peso final de un lote (con subida de evidencias adicionales)
   */
  registrar_peso_final: async (
    loteId: number,
    dto: DTO_PesoFinal
  ): Promise<RES_LoteMineral> => {
    const formData = new FormData();
    formData.append("peso_final", String(dto.peso_final));

    if (dto.id_proveedor_minero !== null && dto.id_proveedor_minero !== undefined) {
      formData.append("id_proveedor_minero", String(dto.id_proveedor_minero));
    }
    if (dto.id_zona_origen !== null && dto.id_zona_origen !== undefined) {
      formData.append("id_zona_origen", String(dto.id_zona_origen));
    }
    if (dto.numero_contacto !== undefined) {
      formData.append("numero_contacto", dto.numero_contacto);
    }
    if (dto.tipo_producto !== null && dto.tipo_producto !== undefined) {
      formData.append("tipo_producto", dto.tipo_producto);
    }
    if (dto.tipo_mineral !== null && dto.tipo_mineral !== undefined) {
      formData.append("tipo_mineral", dto.tipo_mineral);
    }
    if (dto.peso_inicial !== undefined) {
      formData.append("peso_inicial", String(dto.peso_inicial));
    }
    if (dto.id_vehiculo !== null && dto.id_vehiculo !== undefined) {
      formData.append("id_vehiculo", String(dto.id_vehiculo));
    }
    if (dto.id_empresa_transporte !== null && dto.id_empresa_transporte !== undefined) {
      formData.append("id_empresa_transporte", String(dto.id_empresa_transporte));
    }
    if (dto.id_tipo_vehiculo !== null && dto.id_tipo_vehiculo !== undefined) {
      formData.append("id_tipo_vehiculo", String(dto.id_tipo_vehiculo));
    }
    if (dto.id_conductor !== null && dto.id_conductor !== undefined) {
      formData.append("id_conductor", String(dto.id_conductor));
    }

    if (dto.evidencias_existentes !== undefined && dto.evidencias_existentes !== null) {
      formData.append("evidencias_existentes", JSON.stringify(dto.evidencias_existentes));
    }

    if (dto.evidencias && dto.evidencias.length > 0) {
      dto.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }

    const response = await api.post(`${PATH}/lotes/${loteId}/peso-final`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return unwrapApiResponse<RES_LoteMineral>(response);
  },

  /**
  /**
   * Actualizar lote completo (desde Resumen de Balanza)
   */
  actualizar_lote: async (
    loteId: number,
    dto: DTO_PesoFinal
  ): Promise<RES_LoteMineral> => {
    const formData = new FormData();
    if (dto.peso_final !== undefined && dto.peso_final !== null) {
      formData.append("peso_final", String(dto.peso_final));
    }
    if (dto.id_proveedor_minero !== null && dto.id_proveedor_minero !== undefined) {
      formData.append("id_proveedor_minero", String(dto.id_proveedor_minero));
    }
    if (dto.id_zona_origen !== null && dto.id_zona_origen !== undefined) {
      formData.append("id_zona_origen", String(dto.id_zona_origen));
    }
    if (dto.numero_contacto !== undefined) {
      formData.append("numero_contacto", dto.numero_contacto);
    }
    if (dto.tipo_producto !== null && dto.tipo_producto !== undefined) {
      formData.append("tipo_producto", dto.tipo_producto);
    }
    if (dto.tipo_mineral !== null && dto.tipo_mineral !== undefined) {
      formData.append("tipo_mineral", dto.tipo_mineral);
    }
    if (dto.peso_inicial !== undefined && dto.peso_inicial !== null) {
      formData.append("peso_inicial", String(dto.peso_inicial));
    }
    if (dto.id_vehiculo !== null && dto.id_vehiculo !== undefined) {
      formData.append("id_vehiculo", String(dto.id_vehiculo));
    }
    if (dto.id_empresa_transporte !== null && dto.id_empresa_transporte !== undefined) {
      formData.append("id_empresa_transporte", String(dto.id_empresa_transporte));
    }
    if (dto.id_conductor !== null && dto.id_conductor !== undefined) {
      formData.append("id_conductor", String(dto.id_conductor));
    }
    if (dto.condicion_ingreso !== undefined && dto.condicion_ingreso !== null) {
      formData.append("condicion_ingreso", dto.condicion_ingreso);
    }
    if (dto.motivo !== undefined && dto.motivo !== null) {
      formData.append("motivo", dto.motivo);
    }

    if (dto.evidencias_existentes !== undefined && dto.evidencias_existentes !== null) {
      formData.append("evidencias_existentes", JSON.stringify(dto.evidencias_existentes));
    }

    if (dto.evidencias && dto.evidencias.length > 0) {
      dto.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }

    const response = await api.post(`${PATH}/lotes/${loteId}/actualizar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return unwrapApiResponse<RES_LoteMineral>(response);
  },

  /**
   * Cerrar el proceso de balanza de una recepción
   */
  cerrar_proceso: async (id: number): Promise<void> => {
    const response = await api.put(`${PATH}/${id}/cerrar`);
    unwrapApiResponse<unknown>(response);
  },

  /**
   * Obtener datos del Ticket de Balanza en formato completo para impresión PDF
   * (filas LOTE_RECEPCION del Resumen de Balanza).
   */
  obtener_ticket_balanza: async (loteId: number): Promise<RES_TicketBalanzaData> => {
    const response = await api.get(`${PATH}/lotes/${loteId}/ticket-balanza`);
    return unwrapApiResponse<RES_TicketBalanzaData>(response);
  },

  /**
   * Obtener datos del Ticket de Balanza en formato completo para impresión PDF
   * partiendo de un id_distribucion_detalle (filas DISTRIBUCION_DETALLE del
   * Resumen de Balanza). Soporta orígenes LOTE y BLENDING.
   */
  obtener_ticket_balanza_por_distribucion_detalle: async (
    idDistribucionDetalle: number
  ): Promise<RES_TicketBalanzaData> => {
    const response = await api.get(
      `${PATH}/distribuciones-detalles/${idDistribucionDetalle}/ticket-balanza`
    );
    return unwrapApiResponse<RES_TicketBalanzaData>(response);
  },

  // ─── Particiones desde Balanza ────────────────────────────────────────────

  /**
   * Obtener los lotes padre particionados desde Balanza con particiones activas en
   * la sucursal indicada. Alimenta el header global del frontend.
   */
  get_lotes_padre_particionados: async (
    idSucursal: number,
  ): Promise<RES_LotePadreParticionado[]> => {
    const response = await api.get(`${PATH}/lotes-padre-particionados`, {
      params: { id_sucursal: idSucursal },
    });
    return unwrapApiResponse<RES_LotePadreParticionado[]>(response) ?? [];
  },

  /**
   * Crear una partición adicional de un lote padre (drag a otra unidad).
   */
  crear_particion: async (
    idLote: number,
    dto: DTO_CrearParticion,
  ): Promise<RES_ParticionBalanza[]> => {
    const response = await api.post(`${PATH}/lotes/${idLote}/particiones`, dto);
    return unwrapApiResponse<RES_ParticionBalanza[]>(response);
  },

  /**
   * Listar las particiones activas de un lote.
   */
  listar_particiones: async (
    idLote: number,
  ): Promise<RES_ParticionBalanza[]> => {
    const response = await api.get(`${PATH}/lotes/${idLote}/particiones`);
    return unwrapApiResponse<RES_ParticionBalanza[]>(response) ?? [];
  },

  /**
   * Eliminar físicamente una partición (registra log de cambios + borra archivos).
   */
  eliminar_particion: async (idParticion: number): Promise<void> => {
    const response = await api.delete(`${PATH}/particiones/${idParticion}`);
    unwrapApiResponse<unknown>(response);
  },

  /**
   * Actualizar campos no-peso del lote padre desde una partición (cascada).
   */
  actualizar_campos_no_peso: async (
    idParticion: number,
    dto: DTO_UpdateCamposNoPeso,
  ): Promise<{ particiones: RES_ParticionBalanza[]; lote: RES_LoteMineral }> => {
    const response = await api.put(
      `${PATH}/particiones/${idParticion}/campos-no-peso`,
      dto,
    );
    return unwrapApiResponse<{ particiones: RES_ParticionBalanza[]; lote: RES_LoteMineral }>(
      response,
    );
  },

  /**
   * Registrar peso inicial de una partición (crea ticket si no tiene).
   * Los campos no-peso (proveedor/zona/contacto/producto/material) se persisten
   * en el lote padre vía cascada para que las demás particiones los hereden.
   */
  registrar_peso_inicial_particion: async (
    idParticion: number,
    dto: DTO_PesoInicialParticion,
  ): Promise<RES_ParticionBalanza> => {
    const formData = new FormData();
    formData.append("peso_inicial", String(dto.peso_inicial));
    if (dto.observacion_peso_inicial !== null && dto.observacion_peso_inicial !== undefined) {
      formData.append("observacion_peso_inicial", dto.observacion_peso_inicial);
    }
    if (dto.evidencias_existentes !== undefined && dto.evidencias_existentes !== null) {
      formData.append("evidencias_existentes", JSON.stringify(dto.evidencias_existentes));
    }
    if (dto.evidencias && dto.evidencias.length > 0) {
      dto.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }
    // Campos no-peso (cascada al lote padre). Solo se envían si tienen valor
    // para no sobrescribir con null datos que el operador no tocó.
    appendIfPresent(formData, "id_proveedor_minero", dto.id_proveedor_minero);
    appendIfPresent(formData, "id_zona_origen", dto.id_zona_origen);
    appendIfPresent(formData, "numero_contacto", dto.numero_contacto);
    appendIfPresent(formData, "tipo_producto", dto.tipo_producto);
    appendIfPresent(formData, "tipo_mineral", dto.tipo_mineral);
    const response = await api.post(
      `${PATH}/particiones/${idParticion}/peso-inicial`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return unwrapApiResponse<RES_ParticionBalanza>(response);
  },

  /**
   * Registrar peso final de una partición. Mismo criterio: los campos no-peso
   * presentes en el DTO se persisten en el lote padre vía cascada.
   */
  registrar_peso_final_particion: async (
    idParticion: number,
    dto: DTO_PesoFinalParticion,
  ): Promise<RES_ParticionBalanza> => {
    const formData = new FormData();
    formData.append("peso_final", String(dto.peso_final));
    if (dto.observacion_peso_final !== null && dto.observacion_peso_final !== undefined) {
      formData.append("observacion_peso_final", dto.observacion_peso_final);
    }
    if (dto.evidencias_existentes !== undefined && dto.evidencias_existentes !== null) {
      formData.append("evidencias_existentes", JSON.stringify(dto.evidencias_existentes));
    }
    if (dto.evidencias && dto.evidencias.length > 0) {
      dto.evidencias.forEach((file) => {
        formData.append("evidencias[]", file);
      });
    }
    appendIfPresent(formData, "id_proveedor_minero", dto.id_proveedor_minero);
    appendIfPresent(formData, "id_zona_origen", dto.id_zona_origen);
    appendIfPresent(formData, "numero_contacto", dto.numero_contacto);
    appendIfPresent(formData, "tipo_producto", dto.tipo_producto);
    appendIfPresent(formData, "tipo_mineral", dto.tipo_mineral);
    const response = await api.post(
      `${PATH}/particiones/${idParticion}/peso-final`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return unwrapApiResponse<RES_ParticionBalanza>(response);
  },

  /**
   * Finalizar un lote padre particionado desde Balanza.
   * Suma los peso_neto de las particiones y los asigna como peso oficial del lote.
   */
  finalizar_particion_lote: async (
    idLote: number,
  ): Promise<{ lote: RES_LoteMineral; particiones: RES_ParticionBalanza[] }> => {
    const response = await api.post(`${PATH}/lotes/${idLote}/particion/finalizar`);
    return unwrapApiResponse<{ lote: RES_LoteMineral; particiones: RES_ParticionBalanza[] }>(
      response,
    );
  },

  /**
   * Metadatos del ticket de balanza de una partición para impresión PDF.
   */
  obtener_ticket_balanza_particion: async (
    idParticion: number,
  ): Promise<RES_TicketBalanzaData> => {
    const response = await api.get(
      `${PATH}/particiones/${idParticion}/ticket-balanza`,
    );
    return unwrapApiResponse<RES_TicketBalanzaData>(response);
  },
};

