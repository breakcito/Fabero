import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { CierreLeyesService } from "../service/cierre-leyes.service";
import { GestionLeyesService } from "../../gestion-leyes/service/gestion-leyes.service";
import { AuxService } from "../../../service/auxiliar.service";
import type { LoteSugeridoResponse, LoteCierreResponse, MuestraExternaResponse, MuestraAsociadaResponse } from "../service/cierre-leyes.responses";
import type { GrupoAnalisisResponse } from "../../gestion-leyes/service/gestion-leyes.responses";
import { useNotify } from "../../../hooks/useNotify";
import type { FiltrosLotesSugeridos, GuardarValorPayload, GuardarValorMuestraPayload } from "../service/cierre-leyes.service";
import { TipoOrigen } from "../../../shared/enums/_generic/tipo-origen";
import type { RES_Proveedor } from "../../../service/responses/proveedor";

export type CierreValidacion = { ok: boolean; motivo?: string };

/**
 * Clave estable para identificar una celda (input) y deduplicar saves concurrentes.
 */
const cellKey = (p: Pick<GuardarValorPayload, "id_lote_mineral" | "id_grupo_analisis_detalle" | "uuid_fila" | "tipo_origen"> & { id?: number | null }) =>
  `${p.id_lote_mineral}|${p.id_grupo_analisis_detalle}|${p.uuid_fila}|${p.tipo_origen ?? "_"}|${p.id ?? "new"}`;

/**
 * Determina si una muestra externa puede asociarse a un lote disponible:
 * valida que exista al menos un lote cuyo proveedor coincida con el de la muestra
 * y que esté en estado Pendiente o En Proceso. No se exige que la muestra tenga
 * todos los análisis con dato cargado (esa validación quedó obsoleta).
 */
export const puedeAsociarMuestra = (
  m: MuestraExternaResponse,
  lotesDisponibles: LoteCierreResponse[],
): { ok: boolean; motivo?: string } => {
  const compatible = lotesDisponibles.find(
    (l) => l.id_proveedor_minero !== null && l.id_proveedor_minero === m.id_proveedor_minero,
  );
  if (!compatible) {
    return {
      ok: false,
      motivo: m.proveedor_razon_social
        ? `No hay lotes disponibles del proveedor "${m.proveedor_razon_social}" para asociar.`
        : "No hay lotes disponibles del mismo proveedor para asociar.",
    };
  }
  return { ok: true };
};

/**
 * Clave estable para celdas de una muestra externa.
 */
const cellKeyMuestra = (p: Pick<GuardarValorMuestraPayload, "id_muestra_externa" | "id_grupo_analisis_detalle" | "uuid_fila" | "tipo_origen"> & { id?: number | null }) =>
  `m${p.id_muestra_externa}|${p.id_grupo_analisis_detalle}|${p.uuid_fila}|${p.tipo_origen ?? "_"}|${p.id ?? "new"}`;

export const useCierreLeyes = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [lotes, setLotes] = useState<LoteCierreResponse[]>([]);
  const [lotesSugeridos, setLotesSugeridos] = useState<LoteSugeridoResponse[]>([]);
  const [grupos, setGrupos] = useState<GrupoAnalisisResponse[]>([]);
  const [muestras, setMuestras] = useState<MuestraExternaResponse[]>([]);
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingSugeridos, setLoadingSugeridos] = useState(false);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [loadingMuestras, setLoadingMuestras] = useState(false);
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [guardandoValorPorLote, setGuardandoValorPorLote] = useState<Record<number, boolean>>({});
  const [agregandoAnalisisPorLote, setAgregandoAnalisisPorLote] = useState<Record<number, boolean>>({});
  const [confirmandoLote, setConfirmandoLote] = useState<Record<number, boolean>>({});
  const [iniciandoLoteSugeridoId, setIniciandoLoteSugeridoId] = useState<number | null>(null);
  const [iniciandoMuestraExterna, setIniciandoMuestraExterna] = useState(false);
  const [checkeandoLote, setChequeandoLote] = useState<Record<number, boolean>>({});
  const [asociandoMuestra, setAsociandoMuestra] = useState<Record<number, boolean>>({});
  const [agregandoAnalisisMuestra, setAgregandoAnalisisMuestra] = useState<Record<number, boolean>>({});

  // Set de claves de celda actualmente guardando, para spinner per-cell.
  const [guardandoCelda, setGuardandoCelda] = useState<Set<string>>(new Set());

  // Map idLote -> muestras externas asociadas (cache para no re-disparar fetch cada vez que se abre el modal)
  const [muestrasAsociadasPorLote, setMuestrasAsociadasPorLote] = useState<Record<number, MuestraAsociadaResponse[]>>({});

  // Ref espejo de `lotes` para snapshots / deduplicacion sin causar renders.
  const lotesRef = useRef(lotes);
  useEffect(() => {
    lotesRef.current = lotes;
  }, [lotes]);

  // Ref espejo de `muestras` para el drag & drop lookup sin causar renders.
  const muestrasRef = useRef(muestras);
  useEffect(() => {
    muestrasRef.current = muestras;
  }, [muestras]);

  const cargarLotes = useCallback(async (filtros?: FiltrosLotesSugeridos) => {
    setLoading(true);
    try {
      const data = await CierreLeyesService.getLotesCierre(filtros);
      setLotes((data ?? []).filter((l): l is LoteCierreResponse => l != null && l.id != null));
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al cargar los lotes de cierre");
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  const cargarLotesSugeridos = useCallback(async () => {
    setLoadingSugeridos(true);
    try {
      const data = await CierreLeyesService.getLotesSugeridos();
      setLotesSugeridos(data);
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al cargar los lotes sugeridos");
    } finally {
      setLoadingSugeridos(false);
    }
  }, [notifyError]);

  const cargarGrupos = useCallback(async () => {
    setLoadingGrupos(true);
    try {
      const data = await GestionLeyesService.getGrupos();
      setGrupos(data.filter((g) => g.estado === "Activo"));
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al cargar los grupos de análisis");
    } finally {
      setLoadingGrupos(false);
    }
  }, [notifyError]);

  const cargarMuestrasExternas = useCallback(async () => {
    setLoadingMuestras(true);
    try {
      const data = await CierreLeyesService.getMuestrasExternas();
      setMuestras((data ?? []).filter((m): m is MuestraExternaResponse => m != null && m.id != null));
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al cargar las muestras externas");
    } finally {
      setLoadingMuestras(false);
    }
  }, [notifyError]);

  const cargarProveedores = useCallback(async () => {
    setLoadingProveedores(true);
    try {
      const respuesta = await AuxService.get_proveedores();
      setProveedores(respuesta?.data ?? []);
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al cargar los proveedores");
    } finally {
      setLoadingProveedores(false);
    }
  }, [notifyError]);

  const cargarMuestrasAsociadas = useCallback(async (idLoteMineral: number): Promise<MuestraAsociadaResponse[]> => {
    try {
      const data = await CierreLeyesService.getMuestrasAsociadasPorLote(idLoteMineral);
      setMuestrasAsociadasPorLote((prev) => ({ ...prev, [idLoteMineral]: data }));
      return data;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al cargar las muestras asociadas");
      return [];
    }
  }, [notifyError]);

  useEffect(() => {
    cargarGrupos();
  }, [cargarGrupos]);

  const iniciarLote = async (idLote: number): Promise<boolean> => {
    setIniciandoLoteSugeridoId(idLote);
    try {
      const nuevoLoteCierre = await CierreLeyesService.iniciarLote(idLote);
      if (!nuevoLoteCierre || nuevoLoteCierre.id == null) {
        notifyError("La respuesta del servidor no contiene el lote iniciado.");
        return false;
      }
      setLotes((prev) => [nuevoLoteCierre, ...prev]);
      setLotesSugeridos((prev) => prev.filter((l) => l.id !== idLote));
      notifySuccess("Lote seleccionado e iniciado correctamente");
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("No se pudo iniciar el análisis del lote seleccionado");
      return false;
    } finally {
      setIniciandoLoteSugeridoId(null);
    }
  };

  const iniciarMuestraExterna = async (
    idProveedorMinero: number,
    codigoCliente?: string | null,
    fechaHoraIngreso?: string | null,
  ): Promise<boolean> => {
    setIniciandoMuestraExterna(true);
    try {
      const nuevaMuestra = await CierreLeyesService.iniciarMuestraExterna({
        id_proveedor_minero: idProveedorMinero,
        codigo_cliente: codigoCliente?.trim() || null,
        fecha_hora_ingreso: fechaHoraIngreso || null,
      });
      if (!nuevaMuestra || nuevaMuestra.id == null) {
        notifyError("La respuesta del servidor no contiene la muestra iniciada.");
        return false;
      }
      setMuestras((prev) => [nuevaMuestra, ...prev]);
      notifySuccess(`Muestra externa ${nuevaMuestra.correlativo} iniciada correctamente`);
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("No se pudo iniciar la muestra externa");
      return false;
    } finally {
      setIniciandoMuestraExterna(false);
    }
  };

  /**
   * Guarda un valor de ley.
   *
   * Estrategia:
   *  1) Mutacion OPTIMISTA local: el cambio se refleja inmediatamente en la UI
   *     sin esperar al servidor.
   *  2) POST en background.
   *  3) Si la respuesta trae un `id` para una fila nueva, lo reconcilia localmente.
   *  4) Si falla, revierte la mutacion local usando snapshot y muestra error.
   *  5) Flag per-cell (`guardandoCelda`) para spinner fino, no global.
   */
  const guardarValor = useCallback(async (payload: GuardarValorPayload): Promise<boolean> => {
    if (payload.esta_confirmada && payload.ley <= 0) {
      notifyError("No se puede confirmar un análisis sin un valor mayor a cero.");
      return false;
    }

    const key = cellKey(payload);

    setGuardandoValorPorLote((prev) => ({ ...prev, [payload.id_lote_mineral]: true }));
    setGuardandoCelda((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    // Snapshot para revertir en error
    const snapshot: LoteCierreResponse | undefined = lotesRef.current.find(
      (l) => l != null && l.id === payload.id_lote_mineral,
    );

    // Mutacion optimista local
    setLotes((prev) =>
      prev.map((l) => {
        if (!l || l.id !== payload.id_lote_mineral) return l;
        return {
          ...l,
          analisis: l.analisis.map((a) => {
            const matchesById = payload.id != null && a.id === payload.id;
            const matchesByKey =
              a.id_grupo_analisis_detalle === payload.id_grupo_analisis_detalle &&
              a.uuid_fila === payload.uuid_fila &&
              a.tipo_origen === payload.tipo_origen;
            if (!matchesById && !matchesByKey) return a;
            return { ...a, ley: payload.ley, esta_confirmada: payload.esta_confirmada };
          }),
        };
      }),
    );

    try {
      const servidor = await CierreLeyesService.guardarValorLey(payload);
      if (!servidor || servidor.id == null) {
        notifyError("La respuesta del servidor es inválida.");
        if (snapshot) {
          setLotes((prev) => prev.map((l) => (l && l.id === snapshot.id ? snapshot : l)));
        }
        return false;
      }
      setLotes((prev) => prev.map((l) => (l && l.id === servidor.id ? servidor : l)));
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al guardar el valor de la ley");
      if (snapshot) {
        setLotes((prev) => prev.map((l) => (l && l.id === snapshot.id ? snapshot : l)));
      }
      return false;
    } finally {
      setGuardandoValorPorLote((prev) => {
        const copy = { ...prev };
        delete copy[payload.id_lote_mineral];
        return copy;
      });
      setGuardandoCelda((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, [notifyError]);

  /**
   * Guarda un valor de ley para una muestra externa (misma mecánica que guardarValor pero apuntando a la muestra).
   */
  const guardarValorMuestra = async (payload: GuardarValorMuestraPayload): Promise<boolean> => {
    if (payload.esta_confirmada && payload.ley <= 0) {
      notifyError("No se puede confirmar un análisis sin un valor mayor a cero.");
      return false;
    }

    const key = cellKeyMuestra(payload);
    setGuardandoCelda((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    const snapshot = muestrasRef.current.find((m) => m.id === payload.id_muestra_externa);

    // Mutación optimista local
    setMuestras((prev) =>
      prev.map((m) => {
        if (!m || m.id !== payload.id_muestra_externa) return m;
        return {
          ...m,
          analisis: m.analisis.map((a) => {
            const matchesById = payload.id != null && a.id === payload.id;
            const matchesByKey =
              a.id_grupo_analisis_detalle === payload.id_grupo_analisis_detalle &&
              a.uuid_fila === payload.uuid_fila &&
              a.tipo_origen === payload.tipo_origen;
            if (!matchesById && !matchesByKey) return a;
            return { ...a, ley: payload.ley, esta_confirmada: payload.esta_confirmada };
          }),
        };
      }),
    );

    try {
      const servidor = await CierreLeyesService.guardarValorMuestraExterna(payload);
      if (!servidor || servidor.id == null) {
        notifyError("La respuesta del servidor es inválida.");
        if (snapshot) {
          setMuestras((prev) => prev.map((m) => (m && m.id === snapshot.id ? snapshot : m)));
        }
        return false;
      }
      setMuestras((prev) => prev.map((m) => (m && m.id === servidor.id ? servidor : m)));
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al guardar el valor de la ley en la muestra externa");
      if (snapshot) {
        setMuestras((prev) => prev.map((m) => (m && m.id === snapshot.id ? snapshot : m)));
      }
      return false;
    } finally {
      setGuardandoCelda((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  /**
   * Marca como confirmados TODOS los análisis del lote (a través de todas las
   * `uuid_fila`s) que tengan valor > 0 y aún no estén confirmados. Fan-out
   * paralelo sobre `guardarValor` (cada uno mantiene su optimistic + rollback).
   * Si no hay nada que confirmar, no-op silencioso.
   */
  const confirmarTodoElLote = useCallback(
    async (idLoteMineral: number): Promise<void> => {
      setChequeandoLote((prev) => ({ ...prev, [idLoteMineral]: true }));
      try {
        const lote = lotesRef.current.find((l) => l?.id === idLoteMineral);
        if (!lote) return;

        const recordsToCheck = lote.analisis.filter(
          (a) => a.ley > 0 && !a.esta_confirmada,
        );
        if (recordsToCheck.length === 0) return;

        const results = await Promise.allSettled(
          recordsToCheck.map((a) =>
            guardarValor({
              id: a.id,
              id_lote_mineral: idLoteMineral,
              id_grupo_analisis_detalle: a.id_grupo_analisis_detalle,
              tipo_origen: a.tipo_origen,
              uuid_fila: a.uuid_fila,
              ley: a.ley,
              esta_confirmada: true,
            }),
          ),
        );

        const failed = results.filter(
          (r) => r.status === "rejected" || r.value === false,
        ).length;
        if (failed > 0) {
          notifyError(`${failed} análisis no se pudieron confirmar.`);
        } else {
          notifySuccess(
            `Lote ${lote.correlativo}: ${recordsToCheck.length} análisis confirmados.`,
          );
        }
      } finally {
        setChequeandoLote((prev) => {
          const rest = { ...prev };
          delete rest[idLoteMineral];
          return rest;
        });
      }
    },
    [guardarValor, notifyError, notifySuccess],
  );

  const isChequeandoLote = useCallback(
    (idLoteMineral: number): boolean => Boolean(checkeandoLote[idLoteMineral]),
    [checkeandoLote],
  );

  const agregarAnalisis = async (idLoteMineral: number): Promise<boolean> => {
    setAgregandoAnalisisPorLote((prev) => ({ ...prev, [idLoteMineral]: true }));
    try {
      const loteActualizado = await CierreLeyesService.agregarAnalisis(idLoteMineral);
      if (!loteActualizado || loteActualizado.id == null) {
        notifyError("La respuesta del servidor es inválida.");
        return false;
      }
      setLotes((prev) => prev.map((l) => (l && l.id === idLoteMineral ? loteActualizado : l)));
      notifySuccess("Nuevo análisis agregado");
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al agregar el análisis");
      return false;
    } finally {
      setAgregandoAnalisisPorLote((prev) => {
        const copy = { ...prev };
        delete copy[idLoteMineral];
        return copy;
      });
    }
  };

  const eliminarFila = async (idLoteMineral: number, uuidFila: string): Promise<boolean> => {
    setGuardandoValorPorLote((prev) => ({ ...prev, [idLoteMineral]: true }));
    try {
      const loteActualizado = await CierreLeyesService.eliminarFila(idLoteMineral, uuidFila);
      if (!loteActualizado || loteActualizado.id == null) {
        notifyError("La respuesta del servidor es inválida.");
        return false;
      }
      setLotes((prev) => prev.map((l) => (l && l.id === idLoteMineral ? loteActualizado : l)));
      notifySuccess("Fila de análisis eliminada");
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al eliminar la fila de análisis");
      return false;
    } finally {
      setGuardandoValorPorLote((prev) => {
        const copy = { ...prev };
        delete copy[idLoteMineral];
        return copy;
      });
    }
  };

const eliminarFilaMuestra = async (idMuestraExterna: number, uuidFila: string): Promise<boolean> => {
    try {
      const muestraActualizada = await CierreLeyesService.eliminarFilaMuestraExterna(idMuestraExterna, uuidFila);
      // Si el backend retorna null, la muestra fue eliminada en cascada (sin análisis restantes).
      if (muestraActualizada === null || muestraActualizada === undefined) {
        setMuestras((prev) => prev.filter((m) => m.id !== idMuestraExterna));
        notifySuccess("Muestra externa eliminada por quedar sin análisis");
        return true;
      }
      if (!muestraActualizada.id) {
        notifyError("La respuesta del servidor es inválida.");
        return false;
      }
      setMuestras((prev) => prev.map((m) => (m && m.id === idMuestraExterna ? muestraActualizada : m)));
      notifySuccess("Corrida de análisis de muestra externa eliminada");
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al eliminar la corrida de la muestra");
      return false;
    }
  };

  const agregarAnalisisMuestra = async (idMuestraExterna: number): Promise<boolean> => {
    setAgregandoAnalisisMuestra((prev) => ({ ...prev, [idMuestraExterna]: true }));
    try {
      const muestraActualizada = await CierreLeyesService.agregarAnalisisMuestra(idMuestraExterna);
      if (!muestraActualizada || muestraActualizada.id == null) {
        notifyError("La respuesta del servidor es inválida.");
        return false;
      }
      setMuestras((prev) => prev.map((m) => (m && m.id === idMuestraExterna ? muestraActualizada : m)));
      notifySuccess("Nuevo análisis agregado a la muestra externa");
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al agregar el análisis a la muestra externa");
      return false;
    } finally {
      setAgregandoAnalisisMuestra((prev) => {
        const copy = { ...prev };
        delete copy[idMuestraExterna];
        return copy;
      });
    }
  };

  const actualizarOrigenFilaMuestra = async (
    idMuestraExterna: number,
    uuidFila: string,
    tipoOrigen: TipoOrigen | null,
  ): Promise<boolean> => {
    try {
      const muestraActualizada = await CierreLeyesService.actualizarOrigenFilaMuestraExterna(
        idMuestraExterna,
        uuidFila,
        tipoOrigen,
      );
      if (!muestraActualizada || muestraActualizada.id == null) {
        notifyError("La respuesta del servidor es inválida.");
        return false;
      }
      setMuestras((prev) => prev.map((m) => (m && m.id === idMuestraExterna ? muestraActualizada : m)));
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al actualizar el origen de la corrida de la muestra");
      return false;
    }
  };

  /**
   * Confirmar lote con leyes manuales opcionales. Si el front provee leyes_manuales, el backend las usa como override del promedio automático.
   */
  const confirmarLote = async (
    idLoteMineral: number,
    conValorComercial: boolean,
    leyesManuales?: Array<{ id_grupo_analisis_detalle: number; ley: number }>,
  ): Promise<LoteCierreResponse | null> => {
    setConfirmandoLote((prev) => ({ ...prev, [idLoteMineral]: true }));
    try {
      const loteActualizado = await CierreLeyesService.confirmarLoteLeyes(
        idLoteMineral,
        conValorComercial,
        leyesManuales,
      );
      if (!loteActualizado || loteActualizado.id == null) {
        notifyError("La respuesta del servidor es inválida.");
        return null;
      }
      setLotes((prev) => prev.map((l) => (l && l.id === idLoteMineral ? loteActualizado : l)));
      notifySuccess(
        `Lote confirmado ${conValorComercial ? "Con Valor Comercial" : "Sin Valor Comercial"} correctamente`,
      );
      return loteActualizado;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al confirmar el cierre del lote");
      return null;
    } finally {
      setConfirmandoLote((prev) => {
        const copy = { ...prev };
        delete copy[idLoteMineral];
        return copy;
      });
    }
  };

  /**
   * Asocia una muestra externa a un lote. Tras el éxito:
   *  - Remueve la muestra de la lista de activas.
   *  - Reemplaza/actualiza el lote con la respuesta del servidor.
   *  - Limpia cache de muestrasAsociadasPorLote para que se refresque al abrir.
   */
  /**
   * Asocia una muestra externa a un lote. Tras el éxito:
   *  - Remueve la muestra de la lista de activas.
   *  - Reemplaza/actualiza el lote con la respuesta del servidor.
   *  - Limpia cache de muestrasAsociadasPorLote para que se refresque al abrir.
   *  - `opts.notify` (default true) silencia los notify de éxito/error. Usado por el wrapper multi.
   */
  const asociarMuestraALote = async (
    idMuestraExterna: number,
    idLoteMineral: number,
    opts?: { notify?: boolean },
  ): Promise<boolean> => {
    const shouldNotify = opts?.notify !== false;
    setAsociandoMuestra((prev) => ({ ...prev, [idMuestraExterna]: true }));
    try {
      const respuesta = await CierreLeyesService.asociarMuestraALote(idMuestraExterna, idLoteMineral);
      if (!respuesta || !respuesta.lote) {
        if (shouldNotify) notifyError("La respuesta del servidor es inválida.");
        return false;
      }
      setMuestras((prev) => prev.filter((m) => m.id !== idMuestraExterna));
      setLotes((prev) => {
        const existe = prev.some((l) => l && l.id === idLoteMineral);
        if (existe) {
          return prev.map((l) => (l && l.id === idLoteMineral ? respuesta.lote : l));
        }
        return [respuesta.lote, ...prev];
      });
      setLotesSugeridos((prev) => prev.filter((l) => l.id !== idLoteMineral));
      void cargarLotesSugeridos();
      void cargarMuestrasAsociadas(idLoteMineral);

      if (shouldNotify) {
        notifySuccess(
          `Muestra asociada al lote ${respuesta.lote.correlativo} (${respuesta.analisis_migrados} análisis migrados).`,
        );
      }
      return true;
    } catch (err: unknown) {
      console.error(err);
      if (shouldNotify) notifyError("Error al asociar la muestra externa al lote");
      return false;
    } finally {
      setAsociandoMuestra((prev) => {
        const copy = { ...prev };
        delete copy[idMuestraExterna];
        return copy;
      });
    }
  };

  /**
   * Asocia varias muestras externas a un mismo lote, en orden y secuencialmente.
   * Cada llamada reutiliza `asociarMuestraALote` con notify silenciado y emite una sola
   * notificación resumen al final (éxito total / parcial / total).
   * Secuencial para evitar race conditions: el backend reescribe el `lote` en cada llamada
   * y las llamadas paralelas perderían los cambios de las otras.
   */
  const asociarMultiplesMuestrasALote = async (
    idsMuestraExterna: number[],
    idLoteMineral: number,
  ): Promise<boolean> => {
    if (idsMuestraExterna.length === 0) return false;
    let successCount = 0;
    let failureCount = 0;
    for (const idMuestra of idsMuestraExterna) {
      const ok = await asociarMuestraALote(idMuestra, idLoteMineral, { notify: false });
      if (ok) successCount++;
      else failureCount++;
    }
    if (failureCount === 0) {
      notifySuccess(
        `${successCount} muestra${successCount === 1 ? "" : "s"} asociada${successCount === 1 ? "" : "s"} correctamente al lote.`,
      );
      return true;
    }
    if (successCount === 0) {
      notifyError(`No se pudo asociar ninguna muestra (${failureCount} fallaron).`);
      return false;
    }
    notifyError(
      `${successCount} asociada${successCount === 1 ? "" : "s"}, ${failureCount} fallaron.`,
    );
    return false;
  };

  const isAsociandoMuestra = useCallback(
    (idMuestraExterna: number): boolean => Boolean(asociandoMuestra[idMuestraExterna]),
    [asociandoMuestra],
  );

  const isAgregandoAnalisisMuestra = useCallback(
    (idMuestraExterna: number): boolean => Boolean(agregandoAnalisisMuestra[idMuestraExterna]),
    [agregandoAnalisisMuestra],
  );

  const actualizarOrigenFila = async (
    idLoteMineral: number,
    uuidFila: string,
    tipoOrigen: TipoOrigen | null,
  ): Promise<boolean> => {
    setGuardandoValorPorLote((prev) => ({ ...prev, [idLoteMineral]: true }));
    try {
      const loteActualizado = await CierreLeyesService.actualizarOrigenFila(idLoteMineral, uuidFila, tipoOrigen);
      if (!loteActualizado || loteActualizado.id == null) {
        notifyError("La respuesta del servidor es inválida.");
        return false;
      }
      setLotes((prev) => prev.map((l) => (l && l.id === idLoteMineral ? loteActualizado : l)));
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al actualizar el origen de la corrida");
      return false;
    } finally {
      setGuardandoValorPorLote((prev) => {
        const copy = { ...prev };
        delete copy[idLoteMineral];
        return copy;
      });
    }
  };

  const validarCierre = useCallback(
    (lote: LoteCierreResponse, gruposAnalisis: GrupoAnalisisResponse[]): CierreValidacion => {
      if (!lote.analisis || lote.analisis.length === 0) {
        return {
          ok: false,
          motivo: "El lote no tiene registros de análisis.",
        };
      }

      for (const g of gruposAnalisis) {
        for (const a of g.analitos) {
          const valOro = a.para_valorizacion_oro as unknown;
          const valPlata = a.para_valorizacion_plata as unknown;
          const valHumedad = a.para_valorizacion_humedad as unknown;
          const valRec = a.para_valorizacion_recuperacion as unknown;

          const esParaValorizar =
            valOro === true || valOro === 1 || valOro === "1" ||
            valPlata === true || valPlata === 1 || valPlata === "1" ||
            valHumedad === true || valHumedad === 1 || valHumedad === "1" ||
            valRec === true || valRec === 1 || valRec === "1";

          if (!esParaValorizar) continue;

          const tieneConfirmadoValido = lote.analisis.some((item) => {
            const sameDetalle = Number(item.id_grupo_analisis_detalle) === Number(a.detalle_id);
            const rawConf = item.esta_confirmada as unknown;
            const isConfirmed = rawConf === true || rawConf === 1 || rawConf === "1";
            const hasValidValue = item.ley !== null && item.ley !== undefined && Number(item.ley) > 0;
            return sameDetalle && isConfirmed && hasValidValue;
          });

          if (!tieneConfirmadoValido) {
            return {
              ok: false,
              motivo: `El analito "${a.nombre}" requiere al menos un análisis confirmado con un valor mayor a cero.`,
            };
          }
        }
      }

      return { ok: true };
    },
    [],
  );

  const validacionCierrePorLote = useMemo(() => {
    const out: Record<number, CierreValidacion> = {};
    for (const l of lotes) {
      if (!l || l.id == null) continue;
      out[l.id] = validarCierre(l, grupos);
    }
    return out;
  }, [lotes, grupos, validarCierre]);

  const guardarCeldaSet = useMemo(() => guardandoCelda, [guardandoCelda]);

  const isGuardandoCelda = useCallback(
    (key: string) => guardarCeldaSet.has(key),
    [guardarCeldaSet],
  );

  return {
    lotes,
    lotesSugeridos,
    grupos,
    muestras,
    proveedores,
    loading: loading || loadingGrupos,
    loadingSugeridos,
    loadingMuestras,
    loadingProveedores,
    guardandoValorPorLote,
    agregandoAnalisisPorLote,
    confirmandoLote,
    validacionCierrePorLote,
    iniciandoLoteSugeridoId,
    iniciandoMuestraExterna,
    muestrasAsociadasPorLote,
    isGuardandoCelda,
    isAsociandoMuestra,
    cellKey,
    cargarLotes,
    cargarLotesSugeridos,
    cargarGrupos,
    cargarMuestrasExternas,
    cargarProveedores,
    cargarMuestrasAsociadas,
    iniciarLote,
    iniciarMuestraExterna,
    guardarValor,
    guardarValorMuestra,
    agregarAnalisis,
    eliminarFila,
    eliminarFilaMuestra,
    confirmarLote,
    actualizarOrigenFila,
    actualizarOrigenFilaMuestra,
    confirmarTodoElLote,
    isChequeandoLote,
    asociarMuestraALote,
    asociarMultiplesMuestrasALote,
    agregarAnalisisMuestra,
    isAgregandoAnalisisMuestra,
  };
};
