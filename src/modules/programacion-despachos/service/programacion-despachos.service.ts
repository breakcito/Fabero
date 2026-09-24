import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type {
  CrearDespachoRequest,
  CrearDistribucionRequest,
  DespachoFiltros,
  DTO_ActualizarGuiaSegundoTramo,
  DTO_CrearGuiaSegundoTramo,
  DTO_DatosCliente,
  PesarDistribucionDetalleRequest,
} from "./programacion-despachos.requests";
import type {
  ActaSalidaVehiculoData,
  CrearDistribucionResult,
  DespachoDetalle,
  DespachoListItem,
  DistribucionDetalleItem,
  GuiaSegundoTramo,
  ItemDisponibleDespacho,
} from "./programacion-despachos.responses";

const appendIfPresent = (
  formData: FormData,
  key: string,
  value: string | number | null | undefined,
): void => {
  if (value === null || value === undefined || value === "") return;
  formData.append(key, String(value));
};

const appendDocumento = (
  formData: FormData,
  key: string,
  file: File | null,
): void => {
  if (file) {
    formData.append(key, file);
  }
};

export const ProgramacionDespachosService = {
  getDespachos: async (
    filtros: DespachoFiltros = {},
  ): Promise<DespachoListItem[]> => {
    const { data } = await api.get<IRespuesta<DespachoListItem[]>>(
      "/programacion-despachos",
      { params: filtros },
    );
    return data.data;
  },

  getDespacho: async (id: number): Promise<DespachoDetalle> => {
    const { data } = await api.get<IRespuesta<DespachoDetalle>>(
      `/programacion-despachos/${id}`,
    );
    return data.data;
  },

  getItemsDisponibles: async (
    filters: { id_empresa?: number | null } = {},
  ): Promise<ItemDisponibleDespacho[]> => {
    const params: Record<string, string | number> = {};
    if (filters.id_empresa !== undefined && filters.id_empresa !== null) {
      params.id_empresa = filters.id_empresa;
    }
    const { data } = await api.get<IRespuesta<ItemDisponibleDespacho[]>>(
      "/programacion-despachos/items-disponibles",
      { params },
    );
    return data.data;
  },

  crearDespacho: async (
    payload: CrearDespachoRequest,
  ): Promise<DespachoDetalle> => {
    const { data } = await api.post<IRespuesta<DespachoDetalle>>(
      "/programacion-despachos",
      payload,
    );
    return data.data;
  },

  anularDespacho: async (id: number): Promise<DespachoDetalle> => {
    const { data } = await api.patch<IRespuesta<DespachoDetalle>>(
      `/programacion-despachos/${id}/anular`,
    );
    return data.data;
  },

  crearDistribucion: async (
    idDespacho: number,
    payload: CrearDistribucionRequest,
  ): Promise<CrearDistribucionResult> => {
    const { data } = await api.post<IRespuesta<CrearDistribucionResult>>(
      `/programacion-despachos/${idDespacho}/distribuciones`,
      payload,
    );
    return data.data;
  },

  pesarDistribucionDetalle: async (
    idDistribucion: number,
    idDetalle: number,
    payload: PesarDistribucionDetalleRequest,
  ): Promise<{ detalle: DistribucionDetalleItem; id_ticket_balanza: number; peso_neto: number; advertencias: string[] }> => {
    const { data } = await api.post<
      IRespuesta<{ detalle: DistribucionDetalleItem; id_ticket_balanza: number; peso_neto: number; advertencias: string[] }>
    >(
      `/programacion-despachos/distribuciones/${idDistribucion}/detalles/${idDetalle}/pesar`,
      payload,
    );
    return data.data;
  },

  getLotesDisponiblesParaDistribucion: async (
    idDistribucion: number,
  ): Promise<ItemDisponibleDespacho[]> => {
    const { data } = await api.get<IRespuesta<ItemDisponibleDespacho[]>>(
      `/programacion-despachos/distribuciones/${idDistribucion}/lotes-disponibles`,
    );
    return data.data;
  },

  agregarDetalleDistribucion: async (
    idDistribucion: number,
    payload: { id_despacho_detalle: number; peso_tomado: number },
  ): Promise<DistribucionDetalleItem> => {
    const { data } = await api.post<IRespuesta<DistribucionDetalleItem>>(
      `/programacion-despachos/distribuciones/${idDistribucion}/detalles`,
      payload,
    );
    return data.data;
  },

  getGuiaSegundoTramo: async (
    idDistribucion: number,
  ): Promise<GuiaSegundoTramo | null> => {
    const { data } = await api.get<IRespuesta<GuiaSegundoTramo | null>>(
      `/programacion-despachos/distribuciones/${idDistribucion}/guia-segundo-tramo`,
    );
    return data.data;
  },

  crearGuiaSegundoTramo: async (
    idDistribucion: number,
    dto: DTO_CrearGuiaSegundoTramo,
  ): Promise<GuiaSegundoTramo> => {
    const formData = new FormData();
    appendIfPresent(formData, "motivo_traslado", dto.motivo_traslado);
    appendIfPresent(formData, "fecha_inicio_traslado", dto.fecha_inicio_traslado);
    appendIfPresent(formData, "fecha_emision", dto.fecha_emision);
    appendIfPresent(formData, "fecha_en_planta", dto.fecha_en_planta);
    appendIfPresent(formData, "guia_remitente", dto.guia_remitente);
    if (dto.sin_guia_transportista) {
      formData.append("sin_guia_transportista", "1");
    } else {
      formData.append("sin_guia_transportista", "0");
      appendIfPresent(formData, "guia_transportista", dto.guia_transportista);
    }
    // Remitente: el backend usa `tipo_remitente` para decidir si `id_remitente`
    // va a la columna `id_empresa` o `id_planta_destino` (no se persiste
    // como columna propia). Hay que enviarlo cuando hay remitente seleccionado.
    appendIfPresent(formData, "id_remitente", dto.id_remitente);
    appendIfPresent(formData, "tipo_remitente", dto.tipo_remitente);
    appendDocumento(formData, "documento_guia_remitente", dto.documento_guia_remitente);
    if (!dto.sin_guia_transportista) {
      appendDocumento(formData, "documento_guia_transportista", dto.documento_guia_transportista);
    }

    const { data } = await api.post<IRespuesta<GuiaSegundoTramo>>(
      `/programacion-despachos/distribuciones/${idDistribucion}/guia-segundo-tramo`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.data;
  },

  actualizarGuiaSegundoTramo: async (
    idDistribucion: number,
    idGuia: number,
    dto: DTO_ActualizarGuiaSegundoTramo,
  ): Promise<GuiaSegundoTramo> => {
    const formData = new FormData();
    appendIfPresent(formData, "motivo_traslado", dto.motivo_traslado);
    appendIfPresent(formData, "fecha_inicio_traslado", dto.fecha_inicio_traslado);
    appendIfPresent(formData, "fecha_emision", dto.fecha_emision);
    appendIfPresent(formData, "fecha_en_planta", dto.fecha_en_planta);
    appendIfPresent(formData, "guia_remitente", dto.guia_remitente);
    if (dto.sin_guia_transportista) {
      formData.append("sin_guia_transportista", "1");
    } else {
      formData.append("sin_guia_transportista", "0");
      appendIfPresent(formData, "guia_transportista", dto.guia_transportista);
    }
    appendIfPresent(formData, "id_remitente", dto.id_remitente);
    appendIfPresent(formData, "tipo_remitente", dto.tipo_remitente);
    appendIfPresent(formData, "motivo", dto.motivo);
    if (dto.nombres_evidencias_nuevas && dto.nombres_evidencias_nuevas.length > 0) {
      formData.append(
        "nombres_evidencias_nuevas",
        JSON.stringify(dto.nombres_evidencias_nuevas),
      );
    }
    if (dto.nombres_evidencias_eliminadas && dto.nombres_evidencias_eliminadas.length > 0) {
      formData.append(
        "nombres_evidencias_eliminadas",
        JSON.stringify(dto.nombres_evidencias_eliminadas),
      );
    }
    appendDocumento(formData, "documento_guia_remitente", dto.documento_guia_remitente);
    if (!dto.sin_guia_transportista) {
      appendDocumento(formData, "documento_guia_transportista", dto.documento_guia_transportista);
    }

    const { data } = await api.post<IRespuesta<GuiaSegundoTramo>>(
      `/programacion-despachos/distribuciones/${idDistribucion}/guia-segundo-tramo/${idGuia}/update`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.data;
  },

  /**
   * Persistir la fecha de llegada al cliente y los datos por detalle (peso neto,
   * código, leyes, humedad). La distribución debe estar en "Salió de Planta"
   * (primer registro) o "Llegó al Cliente" (edición).
   *
   * Devuelve el `DespachoDetalle` completo (cabecera + items + distribuciones
   * actualizadas) para que el frontend pueda refrescar sin un GET extra.
   */
  actualizarDatosCliente: async (
    idDistribucion: number,
    dto: DTO_DatosCliente,
  ): Promise<DespachoDetalle> => {
    const { data } = await api.put<IRespuesta<DespachoDetalle>>(
      `/programacion-despachos/distribuciones/${idDistribucion}/datos-cliente`,
      dto,
    );
    return data.data;
  },

  anularGuiaSegundoTramo: async (
    idDistribucion: number,
    idGuia: number,
  ): Promise<void> => {
    await api.patch(
      `/programacion-despachos/distribuciones/${idDistribucion}/guia-segundo-tramo/${idGuia}/anular`,
    );
  },

  /**
   * Obtiene los datos para imprimir el acta de salida de vehículos con carga.
   */
  getActaSalida: async (
    idDistribucion: number,
  ): Promise<ActaSalidaVehiculoData> => {
    const { data } = await api.get<IRespuesta<ActaSalidaVehiculoData>>(
      `/programacion-despachos/distribuciones/${idDistribucion}/acta-salida`,
    );
    return data.data;
  },
};