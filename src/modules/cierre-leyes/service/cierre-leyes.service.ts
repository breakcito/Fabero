import { api } from "../../../service/_api";
import type { TipoOrigen } from "../../../shared/enums/_generic/tipo-origen";
import type {
  LoteSugeridoResponse,
  LoteCierreResponse,
  MuestraExternaResponse,
  MuestraAsociadaResponse,
  IArchivoDoc,
} from "./cierre-leyes.responses";
import type {
  AnalisisItemPayload,
  AnalisisDraftItem,
  CrearGrupoPayload,
  AgregarAnalisisGrupoPayload,
  GuardarValoresAnalisisPayload,
  GuardarLeyesCierreGrupoPayload,
  FiltrosLotesSugeridos,
  IniciarMuestraPayload,
} from "./cierre-leyes.requests";

export type {
  AnalisisItemPayload,
  AnalisisDraftItem,
  CrearGrupoPayload,
  AgregarAnalisisGrupoPayload,
  GuardarValoresAnalisisPayload,
  GuardarLeyesCierreGrupoPayload,
  FiltrosLotesSugeridos,
  IniciarMuestraPayload,
};

const appendAnalisisPayload = (
  formData: FormData,
  payload: {
    id_laboratorio?: number;
    asumido_por?: string;
    numero_ensayo?: number;
    tipo_origen?: TipoOrigen;
    documentos?: File[];
    analisis?: AnalisisItemPayload[];
  },
) => {
  if (payload.analisis && payload.analisis.length > 0) {
    payload.analisis.forEach((item, idx) => {
      if (item.id_laboratorio) {
        formData.append(`analisis[${idx}][id_laboratorio]`, String(item.id_laboratorio));
      }
      if (item.asumido_por) {
        formData.append(`analisis[${idx}][asumido_por]`, item.asumido_por);
      }
      if (item.numero_ensayo) {
        formData.append(`analisis[${idx}][numero_ensayo]`, String(item.numero_ensayo));
      }
      if (item.tipo_origen) {
        formData.append(`analisis[${idx}][tipo_origen]`, item.tipo_origen);
      }
      if (item.documentos && item.documentos.length > 0) {
        item.documentos.forEach((file) => {
          formData.append(`analisis[${idx}][documentos][]`, file);
        });
      }
    });
    return;
  }

  if (payload.id_laboratorio) formData.append("id_laboratorio", String(payload.id_laboratorio));
  if (payload.asumido_por) formData.append("asumido_por", payload.asumido_por);
  if (payload.numero_ensayo) formData.append("numero_ensayo", String(payload.numero_ensayo));
  if (payload.tipo_origen) formData.append("tipo_origen", payload.tipo_origen);
  if (payload.documentos && payload.documentos.length > 0) {
    payload.documentos.forEach((file) => formData.append("documentos[]", file));
  }
};

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

  crearGrupo: async (payload: CrearGrupoPayload): Promise<{ id: number }> => {
    const formData = new FormData();
    if (payload.id_lote_mineral) formData.append("id_lote_mineral", String(payload.id_lote_mineral));
    if (payload.id_muestra_externa) formData.append("id_muestra_externa", String(payload.id_muestra_externa));
    formData.append("nombre", payload.nombre);
    appendAnalisisPayload(formData, payload);

    const { data } = await api.post("/cierre-leyes/grupos", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  agregarAnalisisGrupo: async (idGrupo: number, payload: AgregarAnalisisGrupoPayload): Promise<{ id: number }> => {
    const formData = new FormData();
    appendAnalisisPayload(formData, payload);

    const { data } = await api.post(`/cierre-leyes/grupos/${idGrupo}/analisis`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  guardarValoresAnalisis: async (idAnalisis: number, payload: GuardarValoresAnalisisPayload): Promise<void> => {
    await api.post(`/cierre-leyes/analisis/${idAnalisis}/guardar`, payload);
  },

  guardarLeyesCierreGrupo: async (idGrupo: number, payload: GuardarLeyesCierreGrupoPayload): Promise<void> => {
    await api.post(`/cierre-leyes/grupos/${idGrupo}/leyes-cierre`, payload);
  },

  subirDocumentosAnalisis: async (idAnalisis: number, archivos: File[]): Promise<IArchivoDoc[]> => {
    const formData = new FormData();
    for (const f of archivos) {
      formData.append("documentos[]", f);
    }
    const { data } = await api.post(`/cierre-leyes/analisis/${idAnalisis}/documentos`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  eliminarAnalisis: async (idAnalisis: number): Promise<void> => {
    await api.delete(`/cierre-leyes/analisis/${idAnalisis}`);
  },

  confirmarLote: async (idLote: number, conValorComercial: boolean): Promise<void> => {
    await api.post(`/cierre-leyes/lotes/${idLote}/cerrar`, {
      con_valor_comercial: conValorComercial,
    });
  },

  getMuestrasExternas: async (): Promise<MuestraExternaResponse[]> => {
    const { data } = await api.get("/cierre-leyes/muestras-externas");
    return data.data;
  },

  iniciarMuestraExterna: async (payload: IniciarMuestraPayload): Promise<{ id: number; id_muestra_externa: number }> => {
    const formData = new FormData();
    if (payload.codigo_cliente) formData.append("codigo_cliente", payload.codigo_cliente);
    if (payload.nombre) formData.append("nombre", payload.nombre);
    if (payload.id_proveedor) formData.append("id_proveedor", String(payload.id_proveedor));
    if (payload.proveedor_nombre) formData.append("proveedor_nombre", payload.proveedor_nombre);
    if (payload.fecha) formData.append("fecha", payload.fecha);
    appendAnalisisPayload(formData, payload);

    const { data } = await api.post("/cierre-leyes/muestras-externas/iniciar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  agregarAnalisisMuestraExterna: async (idMuestraExterna: number, payload: AgregarAnalisisGrupoPayload): Promise<void> => {
    const formData = new FormData();
    appendAnalisisPayload(formData, payload);

    await api.post(`/cierre-leyes/muestras-externas/${idMuestraExterna}/analisis`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  asociarMuestraAGrupo: async (idMuestraExterna: number, idGrupo: number): Promise<void> => {
    await api.post(`/cierre-leyes/muestras-externas/${idMuestraExterna}/asociar`, {
      id_grupo_analisis: idGrupo,
    });
  },

  asociarMuestrasMultiplesAGrupo: async (idsMuestraExterna: number[], idGrupo: number): Promise<void> => {
    await api.post(`/cierre-leyes/muestras-externas/asociar-multiple`, {
      ids_muestra_externa: idsMuestraExterna,
      id_grupo_analisis: idGrupo,
    });
  },

  getMuestrasAsociadasPorGrupo: async (idGrupo: number): Promise<MuestraAsociadaResponse[]> => {
    const { data } = await api.get(`/cierre-leyes/muestras-externas/asociadas-por-grupo`, {
      params: { id_grupo_analisis: idGrupo },
    });
    return data.data;
  },
};
