import { useState, useEffect, useCallback } from "react";
import { RecepcionMineralService } from "../service/recepcion-mineral.service";
import type {
  RecepcionMineralResponse,
  RES_LoteMineral,
  RES_ParticionBalanza,
  RES_LotePadreParticionado,
  LoteOParticionEnUnidad,
} from "../service/recepcion-mineral.responses";
import type {
  DTO_PesoInicial,
  DTO_PesoFinal,
  DTO_UpdateCamposNoPeso,
} from "../service/recepcion-mineral.requests";
import { useUIStore } from "../../../stores/ui.store";
import { useNotify } from "../../../hooks/useNotify";
import { mostrarConfirmacion } from "../../../presentation/utils/modal-confirmacion";
import { CondicionIngreso } from "../../../shared/enums/_generic/condicion-ingreso";
import type { DistribucionDetalleItem } from "../../programacion-despachos/service/programacion-despachos.responses";

/**
 * Extrae el mensaje legible del backend a partir de cualquier `Error` capturado.
 *
 * Cubre ambos casos:
 *  1. Error HTTP 4xx/5xx de axios → `e.response.data.message`.
 *  2. Error HTTP 200 con `success: false` → `unwrapApiResponse` lo transforma
 *     en `throw new Error(message)`, accesible vía `e.message`.
 *
 * Si ninguno está presente, devuelve el `fallback` provisto.
 */
function extractApiErrorMessage(e: unknown, fallback: string): string {
  const axiosLike = e as { response?: { data?: { message?: string } } };
  if (axiosLike.response?.data?.message) {
    return axiosLike.response.data.message;
  }
  if (e instanceof Error && e.message) {
    return e.message;
  }
  return fallback;
}

export const useRecepcionMineral = () => {
  const sucursal = useUIStore((state) => state.sucursal_elegida);
  const idSucursal = sucursal?.id_sucursal || null;

  const [sinPesarList, setSinPesarList] = useState<RecepcionMineralResponse[]>([]);
  const [enProcesoList, setEnProcesoList] = useState<RecepcionMineralResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecepcion, setSelectedRecepcion] = useState<RecepcionMineralResponse | null>(null);

  // Header global: lotes padre particionados desde Balanza con particiones activas.
  const [lotesPadreParticionados, setLotesPadreParticionados] = useState<
    RES_LotePadreParticionado[]
  >([]);
  const [loadingLotesPadre, setLoadingLotesPadre] = useState(false);

  // Cache de particiones por lote padre: Record<idLote, RES_ParticionBalanza[]>.
  const [particionesByLote, setParticionesByLote] = useState<
    Record<number, RES_ParticionBalanza[]>
  >({});
  const [loadingParticionesByLote, setLoadingParticionesByLote] = useState<
    Record<number, boolean>
  >({});
  const [finalizandoLoteId, setFinalizandoLoteId] = useState<number | null>(null);

  // Loading states granulares por fila / campo / accion
  const [validatingField, setValidatingField] = useState<{
    id: number;
    field: string;
  } | null>(null);
  const [deletingLoteId, setDeletingLoteId] = useState<number | null>(null);
  const [closingProcesoId, setClosingProcesoId] = useState<number | null>(null);
  const [deletingParticionId, setDeletingParticionId] = useState<number | null>(null);
  const [creatingParticionForLote, setCreatingParticionForLote] = useState<
    number | null
  >(null);

  const TEMP_LOTE_CORRELATIVO = "···";

  const { notifySuccess, notifyError } = useNotify();

  const loadRecepciones = async (
    options: { showLoading?: boolean } = {},
  ) => {
    if (!idSucursal) {
      setSinPesarList([]);
      setEnProcesoList([]);
      setLotesPadreParticionados([]);
      return;
    }

    if (options.showLoading !== false) {
      setLoading(true);
    }
    try {
      // Obtenemos todas las recepciones activas en planta de esta sucursal
      const data = await RecepcionMineralService.get_recepciones_mineral(idSucursal);

      const sinPesar = data.filter((r) => r.estado_pesaje === "Sin Pesar");
      const enProceso = data.filter((r) => r.estado_pesaje === "En Proceso");

      setSinPesarList(sinPesar);
      setEnProcesoList(enProceso);

      // Mantener seleccionada la unidad si sigue estando en la lista de datos actualizados
      if (selectedRecepcion) {
        const found = data.find((r) => r.id === selectedRecepcion.id);
        if (found) {
          setSelectedRecepcion(found);
        } else {
          setSelectedRecepcion(null);
        }
      }

      // Header global: lotes padre particionados con particiones activas.
      try {
        setLoadingLotesPadre(true);
        const padres = await RecepcionMineralService.get_lotes_padre_particionados(idSucursal);
        setLotesPadreParticionados(padres);
        // Limpiar del cache de particiones cualquier lote padre que ya no esté activo/existente
        const activeIds = new Set(padres.map((p) => p.id));
        setParticionesByLote((prev) => {
          let changed = false;
          const next: Record<number, RES_ParticionBalanza[]> = {};
          for (const [idStr, parts] of Object.entries(prev)) {
            const numId = Number(idStr);
            if (activeIds.has(numId)) {
              next[numId] = parts;
            } else {
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      } catch (e) {
        console.error("Error al cargar lotes padre particionados", e);
        setLotesPadreParticionados([]);
      } finally {
        setLoadingLotesPadre(false);
      }
    } catch (e: unknown) {
      console.error(e);
      notifyError("Ocurrió un error al cargar las recepciones de unidades");
    } finally {
      if (options.showLoading !== false) {
        setLoading(false);
      }
    }
  };

  /**
   * Refresca el header global de lotes padre particionados. Usado tras cualquier
   * mutación que pueda cambiar `particiones_sin_peso_final` o `total_particiones`
   * (crear lote, crear/eliminar/pesar partición, cerrar proceso, finalizar).
   */
  const refreshLotesPadreParticionados = useCallback(async (): Promise<void> => {
    if (!idSucursal) {
      setLotesPadreParticionados([]);
      return;
    }
    setLoadingLotesPadre(true);
    try {
      const padres = await RecepcionMineralService.get_lotes_padre_particionados(idSucursal);
      setLotesPadreParticionados(padres);
      // Limpiar del cache de particiones cualquier lote padre que ya no esté activo/existente
      const activeIds = new Set(padres.map((p) => p.id));
      setParticionesByLote((prev) => {
        let changed = false;
        const next: Record<number, RES_ParticionBalanza[]> = {};
        for (const [idStr, parts] of Object.entries(prev)) {
          const numId = Number(idStr);
          if (activeIds.has(numId)) {
            next[numId] = parts;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    } catch (e) {
      console.error("Error al refrescar header de lotes padre", e);
    } finally {
      setLoadingLotesPadre(false);
    }
  }, [idSucursal]);

  /**
   * Refresca el cache de particiones de un lote padre. Usado tras crear/eliminar/
   * pesar/finalizar cualquier partición.
   */
  const refreshParticionesLote = useCallback(
    async (idLote: number): Promise<RES_ParticionBalanza[]> => {
      setLoadingParticionesByLote((prev) => ({ ...prev, [idLote]: true }));
      try {
        const data = await RecepcionMineralService.listar_particiones(idLote);
        setParticionesByLote((prev) => ({ ...prev, [idLote]: data }));
        return data;
      } catch (e) {
        console.error("Error al listar particiones del lote", idLote, e);
        notifyError("No se pudieron cargar las particiones del lote.");
        return [];
      } finally {
        setLoadingParticionesByLote((prev) => ({ ...prev, [idLote]: false }));
      }
    },
    [notifyError],
  );

  useEffect(() => {
    loadRecepciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSucursal]);

  const iniciarProceso = async (id: number) => {
    const original = sinPesarList.find((r) => r.id === id);
    if (!original) return;

    const optimista: RecepcionMineralResponse = {
      ...original,
      estado_pesaje: "En Proceso",
    };

    setSinPesarList((prev) => prev.filter((r) => r.id !== id));
    setEnProcesoList((prev) =>
      prev.some((r) => r.id === id) ? prev : [optimista, ...prev],
    );
    setSelectedRecepcion(optimista);

    try {
      const res = await RecepcionMineralService.iniciar_pesaje(id);
      notifySuccess("Proceso de pesaje iniciado correctamente");
      setEnProcesoList((prev) => prev.map((r) => (r.id === id ? res : r)));
      if (selectedRecepcion?.id === id) setSelectedRecepcion(res);
    } catch (e: unknown) {
      console.error(e);
      notifyError("No se pudo iniciar el proceso de pesaje");
      setSinPesarList((prev) =>
        prev.some((r) => r.id === id) ? prev : [original, ...prev],
      );
      setEnProcesoList((prev) => prev.filter((r) => r.id !== id));
      setSelectedRecepcion((prev) => (prev?.id === id ? null : prev));
    }
  };

  const validarCampo = async (id: number, field: string, value: unknown) => {
    setValidatingField({ id, field });
    try {
      const res = await RecepcionMineralService.validar_campo(id, field, value);
      notifySuccess("Dato validado correctamente");

      setEnProcesoList((prev) => prev.map((r) => (r.id === id ? res : r)));
      if (selectedRecepcion?.id === id) {
        setSelectedRecepcion(res);
      }
    } catch (e: unknown) {
      console.error(e);
      notifyError("Error al validar el dato");
    } finally {
      setValidatingField(null);
    }
  };

  const crearLote = async (
    id: number,
    condicionIngreso: CondicionIngreso,
    idEmpresa: number,
    flags?: { conCodigoManual: boolean; codigoManual?: string; particionar?: boolean },
  ) => {
    const tempId = -Date.now();
    const tempLote: RES_LoteMineral = {
      id: tempId,
      id_recepcion_unidad: id,
      id_empleado_registro: 0,
      id_empresa: idEmpresa,
      id_proveedor_minero: null,
      id_proveedor_minero_recepcion: null,
      id_zona_origen: null,
      correlativo: TEMP_LOTE_CORRELATIVO,
      numero_correlativo: null,
      con_codigo_manual: flags?.conCodigoManual ?? false,
      numero_contacto: null,
      tipo_producto: null,
      tipo_mineral: null,
      condicion_ingreso: condicionIngreso,
      estado: "Activo",
      log_cambios: null,
      evidencias: null,
      peso_inicial: null,
      fecha_hora_peso_inicial: null,
      observacion_peso_inicial: null,
      peso_final: null,
      fecha_hora_peso_final: null,
      observacion_peso_final: null,
      peso_neto: null,
      peso_actual: null,
      id_vehiculo: null,
      vehiculo_placa: null,
      id_empresa_transporte: null,
      empresa_transporte_razon_social: null,
      id_tipo_vehiculo: null,
      tipo_vehiculo_nombre: null,
      id_conductor: null,
      conductor_nombre_completo: null,
      conductor_dni: null,
      created_at: new Date().toISOString(),
      // Si se va a particionar, marcar el temp como padre desde el inicio
      // para que el filtro `!particionado_desde_balanza` lo oculte del grid
      // de lotes regulares; sólo se mostrará la PARTICIÓN resultante.
      particionado_desde_balanza: flags?.particionar ?? false,
      tiene_particiones: flags?.particionar ?? false,
    };

    setEnProcesoList((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, lotes: [...(r.lotes || []), tempLote] }
          : r,
      ),
    );
    setSelectedRecepcion((prev) =>
      prev?.id === id
        ? { ...prev, lotes: [...(prev.lotes || []), tempLote] }
        : prev,
    );

    // Si se va a particionar, empujar también una PARTICIÓN temp al cache
    // para que el card de la partición "A" aparezca inmediatamente (no
    // tener que esperar a `refreshParticionesLote`). El render usa el campo
    // `correlativo: "···-A"` como placeholder.
    const tempParticion: RES_ParticionBalanza | null = flags?.particionar
      ? {
          id: tempId - 1,
          id_lote_mineral: tempId,
          id_ticket_balanza: null,
          ticket_correlativo: null,
          id_recepcion_unidad: id,
          vehiculo_placa: null,
          correlativo: `${TEMP_LOTE_CORRELATIVO}-A`,
          particion: "A",
          peso_inicial: null,
          fecha_hora_peso_inicial: null,
          peso_final: null,
          fecha_hora_peso_final: null,
          peso_neto: null,
          estado: "Activo",
          es_bloqueado: false,
          esta_validado: false,
          evidencias: null,
          id_proveedor_minero: null,
          proveedor_nombre: null,
          id_zona_origen: null,
          zona_origen_nombre: null,
          numero_contacto: null,
          tipo_producto: null,
          tipo_mineral: null,
          lote_correlativo: TEMP_LOTE_CORRELATIVO,
        }
      : null;

    if (tempParticion) {
      setParticionesByLote((prev) => ({
        ...prev,
        [tempId]: [tempParticion],
      }));
    }

    try {
      const nuevoLote = await RecepcionMineralService.crear_lote(id, {
        condicion_ingreso: condicionIngreso,
        id_empresa: idEmpresa,
        con_codigo_manual: flags?.conCodigoManual ?? false,
        codigo_manual: flags?.codigoManual,
        particionar: flags?.particionar ?? false,
      });
      const msg = flags?.particionar
        ? "Lote particionado generado correctamente: " + nuevoLote.correlativo
        : "Lote generado correctamente: " + nuevoLote.correlativo;
      notifySuccess(msg);

      // Re-fetch completo: garantiza que `enProcesoList` refleja el backend
      // (incluye el nuevo lote). Sin esto, en flujos no particionados el
      // temp optim nunca se renderizaba como card visible. `showLoading: false`
      // evita que el grid desaparezca detrás del spinner global durante el
      // re-fetch — la card del lote se actualiza in-place sin parpadeo.
      await loadRecepciones({ showLoading: false });

      // Si se particionó, refrescar header global + cache de particiones.
      if (nuevoLote.particionado_desde_balanza) {
        // Migrar el temp de partición de la clave `tempId` a la clave
        // definitiva `nuevoLote.id` ANTES del refresh para que la card
        // permanezca visible mientras viaja el GET.
        setParticionesByLote((prev) => {
          if (!(tempId in prev)) return prev;
          const tempParticiones = prev[tempId];
          const next = { ...prev };
          delete next[tempId];
          return { ...next, [nuevoLote.id]: tempParticiones };
        });
        await Promise.all([
          refreshLotesPadreParticionados(),
          refreshParticionesLote(nuevoLote.id), // sobrescribe particionesByLote[nuevoLote.id]
        ]);
      }
    } catch (e: unknown) {
      console.error(e);
      notifyError(extractApiErrorMessage(e, "No se pudo generar el lote"));
      // Limpiar temp de partición si existía.
      if (tempParticion) {
        setParticionesByLote((prev) => {
          if (!(tempId in prev)) return prev;
          const next = { ...prev };
          delete next[tempId];
          return next;
        });
      }
      // Re-fetch para limpiar cualquier estado optimista pendiente.
      await loadRecepciones({ showLoading: false });
    }
  };

  const eliminarLote = (recepcionId: number, loteId: number) => {
    mostrarConfirmacion({
      title: "Eliminar Lote",
      message: "¿Está seguro de que desea eliminar este lote de mineral? Se perderán todos los datos y pesajes asociados.",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      tipo: "peligro",
      onConfirm: async () => {
        setDeletingLoteId(loteId);
        try {
          await RecepcionMineralService.eliminar_lote(loteId);
          notifySuccess("Lote eliminado correctamente");

          setEnProcesoList((prev) =>
            prev.map((r) => {
              if (r.id === recepcionId) {
                const lotes = (r.lotes || []).filter((l) => l.id !== loteId);
                return { ...r, lotes };
              }
              return r;
            })
          );

          setParticionesByLote((prev) => {
            const next = { ...prev };
            delete next[loteId];
            return next;
          });

          if (selectedRecepcion?.id === recepcionId) {
            setSelectedRecepcion((prev) => {
              if (!prev) return null;
              return { ...prev, lotes: (prev.lotes || []).filter((l) => l.id !== loteId) };
            });
          }
        } catch (e: unknown) {
          console.error(e);
          notifyError("No se pudo eliminar el lote");
        } finally {
          setDeletingLoteId(null);
        }
      },
    });
  };

  const actualizarDetalleDistribucion = (
    recepcionId: number,
    detalleActualizado: DistribucionDetalleItem,
  ) => {
    const upsertDetalle = (detalles: DistribucionDetalleItem[] | undefined) => {
      const arr = detalles ?? [];
      const idx = arr.findIndex((d) => d.id === detalleActualizado.id);
      if (idx >= 0) {
        // Existe → reemplazar in-place (caso re-pesar / editar detalle existente).
        return arr.map((d, i) => (i === idx ? detalleActualizado : d));
      }
      // No existe → agregar al final (caso "Asignar Carga" que crea un nuevo
      // `distribucion_detalle` y debe aparecer de inmediato en el card sin
      // recargar la página).
      return [...arr, detalleActualizado];
    };

    setEnProcesoList((prev) =>
      prev.map((r) =>
        r.id === recepcionId
          ? { ...r, distribucion_detalles: upsertDetalle(r.distribucion_detalles) }
          : r,
      ),
    );

    if (selectedRecepcion?.id === recepcionId) {
      setSelectedRecepcion((prev) =>
        prev
          ? { ...prev, distribucion_detalles: upsertDetalle(prev.distribucion_detalles) }
          : prev,
      );
    }
  };

  const registrarPesoInicial = async (recepcionId: number, loteId: number, dto: DTO_PesoInicial) => {
    try {
      const loteActualizado = await RecepcionMineralService.registrar_peso_inicial(loteId, dto);
      notifySuccess("Peso inicial registrado correctamente");

      setEnProcesoList((prev) =>
        prev.map((r) => {
          if (r.id === recepcionId) {
            const lotes = (r.lotes || []).map((l) => (l.id === loteId ? loteActualizado : l));
            return { ...r, lotes };
          }
          return r;
        })
      );

      if (selectedRecepcion?.id === recepcionId) {
        setSelectedRecepcion((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            lotes: (prev.lotes || []).map((l) => (l.id === loteId ? loteActualizado : l)),
          };
        });
      }
      return loteActualizado;
    } catch (e: unknown) {
      console.error(e);
      notifyError("Error al registrar el peso inicial");
      return null;
    }
  };

  const registrarPesoFinal = async (recepcionId: number, loteId: number, dto: DTO_PesoFinal) => {
    try {
      const loteActualizado = await RecepcionMineralService.registrar_peso_final(loteId, dto);
      notifySuccess("Peso final y neto registrado correctamente");

      setEnProcesoList((prev) =>
        prev.map((r) => {
          if (r.id === recepcionId) {
            const lotes = (r.lotes || []).map((l) => (l.id === loteId ? loteActualizado : l));
            return { ...r, lotes };
          }
          return r;
        })
      );

      if (selectedRecepcion?.id === recepcionId) {
        setSelectedRecepcion((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            lotes: (prev.lotes || []).map((l) => (l.id === loteId ? loteActualizado : l)),
          };
        });
      }
      return loteActualizado;
    } catch (e: unknown) {
      console.error(e);
      notifyError("Error al registrar el peso final");
      return null;
    }
  };

  const cerrarProceso = async (id: number) => {
    const original = enProcesoList.find((r) => r.id === id);
    if (!original) return;

    setEnProcesoList((prev) => prev.filter((r) => r.id !== id));
    if (selectedRecepcion?.id === id) setSelectedRecepcion(null);

    setClosingProcesoId(id);
    try {
      await RecepcionMineralService.cerrar_proceso(id);
      notifySuccess("Proceso de balanza cerrado correctamente");
      // Refrescar cache de particiones: el `recepcion_estado_pesaje` cambia a
      // 'Pesado' en backend y `canFinalizarParticionLote` lo lee desde ahí.
      const padresAfectados = new Set<number>();
      for (const arr of Object.values(particionesByLote)) {
        for (const p of arr) {
          if (p.id_recepcion_unidad === id) padresAfectados.add(p.id_lote_mineral);
        }
      }
      await Promise.all([
        refreshLotesPadreParticionados(),
        ...Array.from(padresAfectados).map((idLote) =>
          refreshParticionesLote(idLote),
        ),
      ]);
    } catch (e: unknown) {
      console.error(e);
      setEnProcesoList((prev) =>
        prev.some((r) => r.id === id) ? prev : [original, ...prev],
      );
      const msg = extractApiErrorMessage(e, "No se pudo cerrar el proceso de balanza");
      notifyError(msg);
    } finally {
      setClosingProcesoId(null);
    }
  };

  // ─── Acciones de particiones desde Balanza ────────────────────────────────

  const crearParticion = async (idLote: number, idRecepcionUnidad: number) => {
    setCreatingParticionForLote(idLote);
    try {
      const data = await RecepcionMineralService.crear_particion(idLote, {
        id_recepcion_unidad: idRecepcionUnidad,
      });
      setParticionesByLote((prev) => ({ ...prev, [idLote]: data }));
      notifySuccess("Partición creada correctamente");
      await refreshLotesPadreParticionados();
      return data;
    } catch (e: unknown) {
      console.error(e);
      const msg = extractApiErrorMessage(e, "No se pudo crear la partición");
      notifyError(msg);
      return null;
    } finally {
      setCreatingParticionForLote(null);
    }
  };

  const eliminarParticion = (idParticion: number, idLotePadre: number) => {
    mostrarConfirmacion({
      title: "Eliminar Partición",
      message: "¿Está seguro de que desea eliminar esta partición? Se cambiará su estado a Eliminado (baja lógica): la fila se conserva para trazabilidad y los archivos adjuntos y el ticket asociado NO se borran del disco. El cambio quedará registrado en el log de cambios del lote padre.",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      tipo: "peligro",
      onConfirm: async () => {
        setDeletingParticionId(idParticion);
        try {
          await RecepcionMineralService.eliminar_particion(idParticion);
          notifySuccess("Partición eliminada correctamente");
          await refreshParticionesLote(idLotePadre);
          await refreshLotesPadreParticionados();
        } catch (e: unknown) {
          console.error(e);
          const msg = extractApiErrorMessage(e, "No se pudo eliminar la partición");
          notifyError(msg);
        } finally {
          setDeletingParticionId(null);
        }
      },
    });
  };

  const actualizarCamposNoPeso = async (
    idParticion: number,
    idLotePadre: number,
    dto: DTO_UpdateCamposNoPeso,
  ): Promise<boolean> => {
    try {
      const result = await RecepcionMineralService.actualizar_campos_no_peso(
        idParticion,
        dto,
      );
      setParticionesByLote((prev) => ({
        ...prev,
        [idLotePadre]: result.particiones,
      }));
      // Reflejar el cambio en enProcesoList: la unidad que contiene a esta partición
      // necesita refrescar los campos del lote padre (proveedor, zona, etc.).
      await loadRecepciones();
      return true;
    } catch (e: unknown) {
      console.error(e);
      const msg = extractApiErrorMessage(e, "No se pudieron actualizar los campos del lote");
      notifyError(msg);
      return false;
    }
  };

  const finalizarParticionLote = (idLotePadre: number, totalParticiones: number) => {
    console.log("[finalizarParticionLote] CLICK", { idLotePadre, totalParticiones });
    mostrarConfirmacion({
      title: "Finalizar Lote Particionado",
      message: (
        <>
          ¿Finalizar el lote padre? Se sumarán los pesos netos de las{" "}
          <strong className="text-indigo-400">{totalParticiones} partición(es)</strong>{" "}
          y se asignarán como peso oficial. Esta acción no se puede deshacer.
        </>
      ),
      confirmLabel: "Finalizar",
      cancelLabel: "Cancelar",
      onConfirm: async () => {
        console.log("[finalizarParticionLote] onConfirm START", { idLotePadre });
        setFinalizandoLoteId(idLotePadre);
        try {
          console.log("[finalizarParticionLote] llamando endpoint...");
          const result =
            await RecepcionMineralService.finalizar_particion_lote(idLotePadre);
          console.log("[finalizarParticionLote] endpoint OK", { result });
          notifySuccess("Lote particionado finalizado correctamente");
          // Refrescar header (oculta el card del padre finalizado) y la cache
          // de particiones del padre (las hijas siguen visibles hasta cerrar
          // el proceso de cada unidad; el backend ya rechaza crear nuevas
          // particiones a un padre finalizado en `crear_particion`).
          // NO llamamos `loadRecepciones` aquí: finalizar un lote padre no
          // cambia las recepciones activas (sus particiones hijas siguen
          // pendientes de cerrar proceso). Cargar todo de nuevo sería un
          // refetch innecesario que se siente como recarga completa.
          await Promise.all([
            refreshLotesPadreParticionados(),
            refreshParticionesLote(idLotePadre),
          ]);
          console.log("[finalizarParticionLote] OK completo");
        } catch (e: unknown) {
          console.error("[finalizarParticionLote] ERROR", e);
          const msg = extractApiErrorMessage(e, "No se pudo finalizar el lote particionado");
          notifyError(msg);
        } finally {
          setFinalizandoLoteId(null);
        }
      },
    });
  };

  /**
   * Elimina de forma lógica un lote padre particionado y todas sus particiones.
   * Realiza una limpieza optimista e inmediata de `lotesPadreParticionados` y
   * `particionesByLote`, haciendo que tanto el card del lote padre como los cards
   * de sus particiones hijas desaparezcan instantáneamente de la vista sin parpadeos.
   */
  const eliminarLotePadreParticionado = async (idLotePadre: number): Promise<void> => {
    // 1. Limpieza optimista inmediata del estado local:
    setLotesPadreParticionados((prev) => prev.filter((p) => p.id !== idLotePadre));
    setParticionesByLote((prev) => {
      const next = { ...prev };
      delete next[idLotePadre];
      return next;
    });

    // 2. Ejecutar baja lógica en el backend
    await RecepcionMineralService.eliminar_lote(idLotePadre);

    // 3. Sincronizar en segundo plano
    await Promise.all([
      refreshLotesPadreParticionados(),
      loadRecepciones({ showLoading: false }),
    ]);
  };

  /**
   * Construye el grid unificado de Lotes para una unidad: mezcla lotes regulares
   * (de `lote_mineral`) con particiones (de `particion_lote_mineral`) que tengan
   * `id_recepcion_unidad = ru.id`. Las particiones reemplazan visualmente el slot
   * que ocuparía el lote padre (que está huérfano por diseño).
   *
   * Orden: primero lotes regulares por correlativo ASC, después particiones por letra ASC.
   */
  const getLotesYParticionesDeUnidad = useCallback(
    (ru: RecepcionMineralResponse): LoteOParticionEnUnidad[] => {
      const regulares: LoteOParticionEnUnidad[] = (ru.lotes ?? [])
        .filter((l) => !l.particionado_desde_balanza)
        .map((l) => ({ tipo: "LOTE" as const, lote: l }));

      const particiones: LoteOParticionEnUnidad[] = [];
      Object.values(particionesByLote).forEach((arr) => {
        arr.forEach((p) => {
          if (p.id_recepcion_unidad === ru.id) {
            particiones.push({ tipo: "PARTICION", particion: p });
          }
        });
      });

      particiones.sort((a, b) => {
        const aLetra = a.tipo === "PARTICION" ? a.particion.particion : "";
        const bLetra = b.tipo === "PARTICION" ? b.particion.particion : "";
        return aLetra.localeCompare(bLetra);
      });

      return [...regulares, ...particiones];
    },
    [particionesByLote],
  );

  /**
   * Determina si la unidad está lista para cerrar el proceso de balanza.
   *
   * Reglas:
   *  - Cada lote REGULAR debe tener peso_final registrado.
   *  - Cada PARTICIÓN activa de la unidad debe tener peso_final.
   *  - (El backend valida adicionalmente que el lote padre esté finalizado.)
   *
   * NOTA: el lote PADRE con `particionado_desde_balanza=true` tiene
   * `id_recepcion_unidad = NULL` y por tanto NUNCA aparece en `ru.lotes`
   * (el backend hace INNER JOIN por `id_recepcion_unidad`, ver
   * `Data::get_lotes_by_recepcion`). Se lo representa en pantalla a través
   * de las particiones cacheadas en `particionesByLote`.
   */
  const canCloseProcesoRecepcion = useCallback(
    (ru: RecepcionMineralResponse): boolean => {
      const lotesRegulares = ru.lotes ?? [];
      const tieneLotesRegulares = lotesRegulares.length > 0;
      const particionesDeUnidad = Object.values(particionesByLote)
        .flat()
        .filter((p) => p.id_recepcion_unidad === ru.id);

      const tieneContenido = tieneLotesRegulares || particionesDeUnidad.length > 0;
      if (!tieneContenido) return false;

      if (lotesRegulares.some((l) => l.peso_final === null)) return false;
      if (particionesDeUnidad.some((p) => p.peso_final === null)) return false;

      return true;
    },
    [particionesByLote],
  );

  /**
   * Determina si un lote PADRE particionado está listo para FINALIZAR.
   *
   * Reglas:
   *  - Debe tener al menos 2 particiones activas.
   *  - Todas las particiones deben tener peso_final registrado.
   *  - Todas las particiones deben vivir en una unidad con `estado_pesaje === 'Pesado'`
   *    (lo cual se logra cerrando el proceso de cada unidad huésped).
   *
   * Devuelve:
   *  - `ok`: true sólo si todos los requisitos están cumplidos.
   *  - `motivo`: descripción legible del bloqueo (si lo hay) para mostrar
   *    debajo de la lista de requisitos en el tooltip.
   *  - `requisitos`: lista de los 3 requisitos con su estado individual,
   *    para renderizar el tooltip como checklist `(✓)` / `( )`.
   */
  type RequisitoFinalizar = { nombre: string; cumplido: boolean };
  type CanFinalizarResultado = {
    ok: boolean;
    motivo: string | null;
    requisitos: RequisitoFinalizar[];
  };

  const canFinalizarParticionLote = useCallback(
    (padre: RES_LotePadreParticionado): CanFinalizarResultado => {
      if (padre.particion_finalizada) {
        return {
          ok: false,
          motivo: "El lote ya fue finalizado.",
          requisitos: [
            { nombre: "Todas las particiones pesadas", cumplido: true },
            { nombre: "Al menos 2 particiones activas", cumplido: true },
            { nombre: "Las unidades anfitrionas en estado Pesado", cumplido: true },
          ],
        };
      }

      const total = padre.total_particiones;
      const cumplio2 = total >= 2;

      const particiones = particionesByLote[padre.id] ?? [];
      const cargando = particiones.length !== total;
      const cumplioPeso = !cargando && particiones.every((p) => p.peso_final !== null);
      const cumplioPesado =
        !cargando &&
        particiones.length > 0 &&
        particiones.every((p) => p.recepcion_estado_pesaje === "Pesado");

      const requisitos: RequisitoFinalizar[] = [
        { nombre: "Todas las particiones pesadas", cumplido: cumplioPeso },
        { nombre: "Al menos 2 particiones activas", cumplido: cumplio2 },
        {
          nombre: "Las unidades anfitrionas en estado Pesado",
          cumplido: cumplioPesado,
        },
      ];

      const ok = cumplioPeso && cumplio2 && cumplioPesado;

      let motivo: string | null = null;
      if (cargando) {
        motivo = "Cargando particiones del lote padre…";
      } else if (!cumplio2) {
        motivo = `Se requieren al menos 2 particiones (hay ${total}).`;
      } else if (!cumplioPeso) {
        const sinPesoFinal = particiones.filter((p) => p.peso_final === null).length;
        motivo = `Faltan ${sinPesoFinal} partición(es) por pesar.`;
      } else if (!cumplioPesado) {
        const sinCerrar = particiones.filter(
          (p) => p.recepcion_estado_pesaje !== "Pesado",
        ).length;
        motivo = `Debe cerrar el proceso de ${sinCerrar} unidad(es) anfitriona(s).`;
      }

      return { ok, motivo, requisitos };
    },
    [particionesByLote],
  );

  /**
   * Devuelve la etiqueta de proveedor del lote PADRE para agrupar en el header.
   * El proveedor se setea en cascada cuando se pesa la primera partición (vía
   * `persistir_campos_no_peso_en_padre` en backend) y el backend lo hidrata
   * en cada `RES_ParticionBalanza`. Mientras no haya particiones pesadas, el
   * proveedor es desconocido y el hook devuelve `null` — el page renderiza
   * esos padres sin agrupar (mismo comportamiento que antes).
   *
   * Preferencia: nombre del proveedor > id como fallback.
   */
  const getProveedorDePadre = useCallback(
    (padre: RES_LotePadreParticionado): string | null => {
      const particiones = particionesByLote[padre.id] ?? [];
      for (const p of particiones) {
        if (p.proveedor_nombre) return p.proveedor_nombre;
        if (p.id_proveedor_minero != null) {
          return `id-${p.id_proveedor_minero}`;
        }
      }

      return null;
    },
    [particionesByLote],
  );

  return {
    sinPesarList,
    enProcesoList,
    loading,
    selectedRecepcion,
    setSelectedRecepcion,
    validatingField,
    deletingLoteId,
    closingProcesoId,
    lotesPadreParticionados,
    loadingLotesPadre,
    particionesByLote,
    loadingParticionesByLote,
    deletingParticionId,
    creatingParticionForLote,
    finalizandoLoteId,
    loadRecepciones,
    iniciarProceso,
    validarCampo,
    crearLote,
    eliminarLote,
    registrarPesoInicial,
    registrarPesoFinal,
    actualizarDetalleDistribucion,
    cerrarProceso,
    crearParticion,
    eliminarParticion,
    actualizarCamposNoPeso,
    finalizarParticionLote,
    eliminarLotePadreParticionado,
    refreshParticionesLote,
    refreshLotesPadreParticionados,
    getLotesYParticionesDeUnidad,
    canCloseProcesoRecepcion,
    canFinalizarParticionLote,
    getProveedorDePadre,
  };
};
