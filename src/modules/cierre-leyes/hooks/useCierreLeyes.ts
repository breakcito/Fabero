import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { CierreLeyesService } from "../service/cierre-leyes.service";
import { GestionLeyesService } from "../../gestion-leyes/service/gestion-leyes.service";
import type { LoteSugeridoResponse, LoteCierreResponse, AnalisisMineralResponse } from "../service/cierre-leyes.responses";
import type { GrupoAnalisisResponse } from "../../gestion-leyes/service/gestion-leyes.responses";
import { useNotify } from "../../../hooks/useNotify";
import type { FiltrosLotesSugeridos, GuardarValorPayload } from "../service/cierre-leyes.service";
import { TipoOrigen } from "../../../shared/enums/_generic/tipo-origen";

export type CierreValidacion = { ok: boolean; motivo?: string };

/**
 * Clave estable para identificar una celda (input) y deduplicar saves concurrentes.
 */
const cellKey = (p: Pick<GuardarValorPayload, "id_lote_mineral" | "id_grupo_analisis_detalle" | "uuid_fila" | "tipo_origen"> & { id?: number | null }) =>
  `${p.id_lote_mineral}|${p.id_grupo_analisis_detalle}|${p.uuid_fila}|${p.tipo_origen ?? "_"}|${p.id ?? "new"}`;

export const useCierreLeyes = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [lotes, setLotes] = useState<LoteCierreResponse[]>([]);
  const [lotesSugeridos, setLotesSugeridos] = useState<LoteSugeridoResponse[]>([]);
  const [grupos, setGrupos] = useState<GrupoAnalisisResponse[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingSugeridos, setLoadingSugeridos] = useState(false);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [guardandoValorPorLote, setGuardandoValorPorLote] = useState<Record<number, boolean>>({});
  const [agregandoAnalisisPorLote, setAgregandoAnalisisPorLote] = useState<Record<number, boolean>>({});
  const [confirmandoLote, setConfirmandoLote] = useState<Record<number, boolean>>({});
  const [iniciandoLoteSugeridoId, setIniciandoLoteSugeridoId] = useState<number | null>(null);

  // Set de claves de celda actualmente guardando, para spinner per-cell.
  const [guardandoCelda, setGuardandoCelda] = useState<Set<string>>(new Set());

  // Ref espejo de `lotes` para snapshots / deduplicacion sin causar renders.
  const lotesRef = useRef(lotes);
  useEffect(() => {
    lotesRef.current = lotes;
  }, [lotes]);

  const cargarLotes = useCallback(async (filtros?: FiltrosLotesSugeridos) => {
    setLoading(true);
    try {
      const data = await CierreLeyesService.getLotesCierre(filtros);
      setLotes(data);
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

  useEffect(() => {
    cargarLotesSugeridos();
    cargarGrupos();
  }, [cargarLotesSugeridos, cargarGrupos]);

  const iniciarLote = async (idLote: number): Promise<boolean> => {
    setIniciandoLoteSugeridoId(idLote);
    try {
      const nuevoLoteCierre = await CierreLeyesService.iniciarLote(idLote);
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
  const guardarValor = async (payload: GuardarValorPayload): Promise<boolean> => {
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
    const snapshot: LoteCierreResponse | undefined = lotesRef.current.find((l) => l.id === payload.id_lote_mineral);

    // Mutacion optimista local
    setLotes((prev) =>
      prev.map((l) => {
        if (l.id !== payload.id_lote_mineral) return l;
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
      // Reconciliacion minima: si el server devolvio un lote, sincronizamos
      // el/los `id` de las filas recien creadas (las que tenian id null).
      // NO pisamos ley/esta_confirmada porque ya estan en estado optimo local.
      setLotes((prev) =>
        prev.map((l) => {
          if (l.id !== servidor.id) return l;
          const mapaPorUuid = new Map<string, AnalisisMineralResponse>();
          servidor.analisis.forEach((a) => mapaPorUuid.set(`${a.uuid_fila}|${a.id_grupo_analisis_detalle}|${a.tipo_origen ?? "_"}`, a));
          return {
            ...l,
            // Adoptamos solo los id nuevos del servidor; el resto se mantiene local.
            analisis: l.analisis.map((a) => {
              if (a.id != null) return a;
              const servidorMatch = mapaPorUuid.get(`${a.uuid_fila}|${a.id_grupo_analisis_detalle}|${a.tipo_origen ?? "_"}`);
              return servidorMatch ? { ...a, id: servidorMatch.id } : a;
            }),
          };
        }),
      );
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al guardar el valor de la ley");
      if (snapshot) {
        setLotes((prev) => prev.map((l) => (l.id === snapshot.id ? snapshot : l)));
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
  };

  const agregarAnalisis = async (idLoteMineral: number): Promise<boolean> => {
    setAgregandoAnalisisPorLote((prev) => ({ ...prev, [idLoteMineral]: true }));
    try {
      const loteActualizado = await CierreLeyesService.agregarAnalisis(idLoteMineral);
      setLotes((prev) => prev.map((l) => (l.id === idLoteMineral ? loteActualizado : l)));
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
      setLotes((prev) => prev.map((l) => (l.id === idLoteMineral ? loteActualizado : l)));
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

  const confirmarLote = async (idLoteMineral: number, conValorComercial: boolean): Promise<boolean> => {
    setConfirmandoLote((prev) => ({ ...prev, [idLoteMineral]: true }));
    try {
      const loteActualizado = await CierreLeyesService.confirmarLoteLeyes(idLoteMineral, conValorComercial);
      setLotes((prev) => prev.map((l) => (l.id === idLoteMineral ? loteActualizado : l)));
      notifySuccess(
        `Lote confirmado ${conValorComercial ? "Con Valor Comercial" : "Sin Valor Comercial"} correctamente`,
      );
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al confirmar el cierre del lote");
      return false;
    } finally {
      setConfirmandoLote((prev) => {
        const copy = { ...prev };
        delete copy[idLoteMineral];
        return copy;
      });
    }
  };

  const actualizarOrigenFila = async (
    idLoteMineral: number,
    uuidFila: string,
    tipoOrigen: TipoOrigen | null,
  ): Promise<boolean> => {
    setGuardandoValorPorLote((prev) => ({ ...prev, [idLoteMineral]: true }));
    try {
      const loteActualizado = await CierreLeyesService.actualizarOrigenFila(idLoteMineral, uuidFila, tipoOrigen);
      setLotes((prev) => prev.map((l) => (l.id === idLoteMineral ? loteActualizado : l)));
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

  const validarCierre = useCallback((lote: LoteCierreResponse): CierreValidacion => {
    const sinConfirmar = lote.analisis.find((a) => !a.esta_confirmada);
    if (sinConfirmar) {
      return {
        ok: false,
        motivo: "Hay análisis sin confirmar. Marca todas las casillas antes de cerrar el lote.",
      };
    }
    const leyInvalida = lote.analisis.find((a) => a.ley === null || a.ley === undefined || a.ley <= 0);
    if (leyInvalida) {
      return {
        ok: false,
        motivo: "Hay análisis con valor nulo o igual a cero. Completa todos los valores antes de cerrar el lote.",
      };
    }
    return { ok: true };
  }, []);

  const validacionCierrePorLote = useMemo(() => {
    const out: Record<number, CierreValidacion> = {};
    for (const l of lotes) out[l.id] = validarCierre(l);
    return out;
  }, [lotes, validarCierre]);

  const guardarCeldaSet = useMemo(() => guardandoCelda, [guardandoCelda]);

  const isGuardandoCelda = useCallback(
    (key: string) => guardarCeldaSet.has(key),
    [guardarCeldaSet],
  );

  return {
    lotes,
    lotesSugeridos,
    grupos,
    loading: loading || loadingGrupos,
    loadingSugeridos,
    guardandoValorPorLote,
    agregandoAnalisisPorLote,
    confirmandoLote,
    validacionCierrePorLote,
    iniciandoLoteSugeridoId,
    isGuardandoCelda,
    cellKey,
    cargarLotes,
    cargarLotesSugeridos,
    iniciarLote,
    guardarValor,
    agregarAnalisis,
    eliminarFila,
    confirmarLote,
    actualizarOrigenFila,
  };
};
