import { useState, useCallback, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import type {
  BlendingResponse,
  ItemDisponibleResponse,
} from "../service/blending.responses";
import type {
  EditarBlendingPayload,
  AdicionPesoPayload,
} from "../service/blending.requests";
import { BlendingService } from "../service/blending.service";
import { useNotify } from "../../../hooks/useNotify";
import type { IArchivo } from "../../../shared/interfaces/archivo";

interface TotalesEstimados {
  pesoHumedoTotal: number;
  pesoSecoTotal: number;
  leyOro: number;
  leyPlata: number;
  leyHumedad: number;
  valorAuEstimado: number;
  valorAgEstimado: number;
  valorTotalEstimado: number;
}

const EPSILON = 0.0001;

const calcularTms = (pesoHumedo: number, humedadPorcentaje: number): number => {
  const factor = Math.max(0, 1 - humedadPorcentaje / 100);
  return pesoHumedo * factor;
};

interface ItemCalculable {
  pesoUsado: number;
  ley_humedad: number;
  ley_oro: number;
  ley_plata: number;
}

const calcularTotales = (
  items: ItemCalculable[],
  precioOro: number,
  precioPlata: number
): TotalesEstimados => {
  let pesoHumedoTotal = 0;
  let pesoSecoTotal = 0;
  let sumAuTMS = 0;
  let sumAgTMS = 0;
  const humedades: number[] = [];

  items.forEach(({ pesoUsado, ley_humedad, ley_oro, ley_plata }) => {
    const tms = calcularTms(pesoUsado, ley_humedad);
    pesoHumedoTotal += pesoUsado;
    pesoSecoTotal += tms;
    sumAuTMS += tms * ley_oro;
    sumAgTMS += tms * ley_plata;
    humedades.push(ley_humedad);
  });

  const leyOro = pesoSecoTotal > 0 ? sumAuTMS / pesoSecoTotal : 0;
  const leyPlata = pesoSecoTotal > 0 ? sumAgTMS / pesoSecoTotal : 0;
  const leyHumedad =
    humedades.length > 0 ? humedades.reduce((a, b) => a + b, 0) / humedades.length : 0;

  const valorAuEstimado = (pesoSecoTotal / 1000) * leyOro * (precioOro || 0);
  const valorAgEstimado = (pesoSecoTotal / 1000) * leyPlata * (precioPlata || 0);
  const valorTotalEstimado = valorAuEstimado + valorAgEstimado;

  return {
    pesoHumedoTotal,
    pesoSecoTotal,
    leyOro,
    leyPlata,
    leyHumedad,
    valorAuEstimado,
    valorAgEstimado,
    valorTotalEstimado,
  };
};

export const useEditarBlending = (
  blending: BlendingResponse | null,
  disponibles: ItemDisponibleResponse[] = [],
  onSuccess?: () => void
) => {
  const [fechaHora, setFechaHora] = useState<Date | null>(null);
  const [observacion, setObservacion] = useState<string>("");
  const [evidenciasPersistidas, setEvidenciasPersistidas] = useState<IArchivo[]>([]);
  const [evidenciasFiles, setEvidenciasFiles] = useState<File[]>([]);
  const [evidenciasEliminadas, setEvidenciasEliminadas] = useState<string[]>([]);

  const [nuevosPendientes, setNuevosPendientes] = useState<AdicionPesoPayload[]>([]);

  const [precioOro, setPrecioOro] = useState<number>(0);
  const [precioPlata, setPrecioPlata] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);
  const { notifySuccess, notifyError } = useNotify();

  useEffect(() => {
    if (blending) {
      setFechaHora(blending.fecha_hora_blending ? new Date(blending.fecha_hora_blending) : null);
      setObservacion(blending.observacion || "");
      setEvidenciasPersistidas(blending.evidencias || []);
      setEvidenciasEliminadas([]);
      setEvidenciasFiles([]);
      setNuevosPendientes([]);
      setPrecioOro(0);
      setPrecioPlata(0);
    }
  }, [blending]);

  // ============== Handlers: nuevos detalles pendientes ==============
  const agregarNuevoPendiente = useCallback(
    (item: ItemDisponibleResponse, pesoAdicional: number) => {
      if (pesoAdicional <= 0) return;

      const pesoMax = item.tmh_disponible;
      if (pesoAdicional > pesoMax) {
        notifyError(`Peso excede el disponible (${pesoMax.toFixed(2)} kg).`);
        return;
      }

      setNuevosPendientes((prev) => [
        ...prev,
        {
          id_lote_guia: item.tipo_origen === "lote" ? item.id_lote_guia : null,
          id_reblending: item.tipo_origen === "blending" ? item.id_reblending : null,
          peso_adicional: pesoAdicional,
        },
      ]);
    },
    [notifyError]
  );

  const quitarNuevoPendiente = useCallback((index: number) => {
    setNuevosPendientes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const actualizarNuevoPendiente = useCallback((index: number, nuevoPeso: number) => {
    setNuevosPendientes((prev) =>
      prev.map((p, i) => (i === index ? { ...p, peso_adicional: nuevoPeso } : p))
    );
  }, []);

  // ============== Mejor Combinación (sólo sobre nuevos pendientes) ==============
  const aplicarMejorCombinacion = useCallback(
    (
      disponibles: ItemDisponibleResponse[],
      leyMinOro: number,
      leyMinPlata: number,
      pesoMaxResultante: number
    ) => {
      if (nuevosPendientes.length === 0) {
        notifyError(
          "Agregue al menos un lote nuevo a 'Lotes Seleccionados' antes de usar la Mejor Combinación."
        );
        return;
      }
      if (pesoMaxResultante <= 0) {
        notifyError("El peso máximo resultante debe ser mayor a 0.");
        return;
      }

      // Peso acumulado por los detalles preexistentes (fijos)
      const pesoExistenteTotal = blending?.detalles?.reduce((acc, d) => acc + d.peso_tomado, 0) ?? 0;
      const pesoMaximoParaNuevos = Math.max(0, pesoMaxResultante - pesoExistenteTotal);

      if (pesoMaximoParaNuevos <= 0) {
        notifyError(
          `El peso máximo resultante (${pesoMaxResultante} kg) debe ser mayor al peso existente en la mezcla (${pesoExistenteTotal.toFixed(2)} kg).`
        );
        return;
      }

      // Construir catálogo de pendientes con info de disponibles (leyes, humedad, stock)
      const conInfo = nuevosPendientes
        .map((p) => {
          const info = disponibles.find(
            (d) =>
              (p.id_lote_guia != null && d.id_lote_guia === p.id_lote_guia) ||
              (p.id_reblending != null && d.id_reblending === p.id_reblending)
          );
          if (!info) return null;
          return { pendiente: p, info };
        })
        .filter((x): x is { pendiente: AdicionPesoPayload; info: ItemDisponibleResponse } => x !== null);

      if (conInfo.length === 0) {
        notifyError("No se pudo resolver la información de los pendientes.");
        return;
      }

      // Filtrar con stock > 0
      const conStock = conInfo.filter((c) => c.info.tmh_disponible > 0);
      if (conStock.length === 0) return;

      // Filtrar por leyes mínimas (70% de tolerancia)
      let candidatos = conStock.filter(
        (c) =>
          (leyMinOro > 0 ? c.info.ley_oro >= leyMinOro * 0.7 : true) &&
          (leyMinPlata > 0 ? c.info.ley_plata >= leyMinPlata * 0.7 : true)
      );
      if (candidatos.length === 0) candidatos = [...conStock];

      // Ordenar por score combinado (Au × 2 + Ag)
      candidatos.sort((a, b) => {
        const scoreA = a.info.ley_oro * 2 + a.info.ley_plata;
        const scoreB = b.info.ley_oro * 2 + b.info.ley_plata;
        return scoreB - scoreA;
      });

      const seleccionadosParaMezcla = candidatos.slice(
        0,
        Math.min(candidatos.length, 6)
      );

      // Repartir pesoMaximoParaNuevos entre los pendientes seleccionados
      const count = seleccionadosParaMezcla.length;
      const pesosAsignados = new Map<number, number>();

      if (count === 1) {
        const { info } = seleccionadosParaMezcla[0];
        const peso = Math.min(info.tmh_disponible, pesoMaximoParaNuevos);
        const key = seleccionadosParaMezcla[0].pendiente.id_lote_guia ?? seleccionadosParaMezcla[0].pendiente.id_reblending ?? -1;
        pesosAsignados.set(key, peso);
      } else {
        const capMaxPorLote = pesoMaximoParaNuevos * 0.65;
        const sumaDisponible = seleccionadosParaMezcla.reduce(
          (acc, curr) => acc + curr.info.tmh_disponible,
          0
        );

        seleccionadosParaMezcla.forEach(({ pendiente, info }) => {
          const key = pendiente.id_lote_guia ?? pendiente.id_reblending ?? -1;
          const proporcion = info.tmh_disponible / (sumaDisponible || 1);
          const pesoIdeal = pesoMaximoParaNuevos * proporcion;
          pesosAsignados.set(key, Math.min(pesoIdeal, info.tmh_disponible, capMaxPorLote));
        });

        // Distribuir remanente
        const sumaAsignada = Array.from(pesosAsignados.values()).reduce(
          (a, b) => a + b,
          0
        );
        if (sumaAsignada < pesoMaximoParaNuevos) {
          let remanente = pesoMaximoParaNuevos - sumaAsignada;
          for (const { pendiente, info } of seleccionadosParaMezcla) {
            if (remanente <= 0.001) break;
            const key = pendiente.id_lote_guia ?? pendiente.id_reblending ?? -1;
            const actual = pesosAsignados.get(key) || 0;
            const margenStock = info.tmh_disponible - actual;
            if (margenStock > 0) {
              const sumar = Math.min(margenStock, remanente);
              pesosAsignados.set(key, actual + sumar);
              remanente -= sumar;
            }
          }
        }
      }

      // Aplicar distribución al estado nuevosPendientes
      setNuevosPendientes((prev) =>
        prev
          .map((p) => {
            const key = p.id_lote_guia ?? p.id_reblending ?? -1;
            const nuevo = pesosAsignados.get(key);
            if (nuevo === undefined || nuevo <= 0.01) {
              return null;
            }
            return { ...p, peso_adicional: Number(nuevo.toFixed(2)) };
          })
          .filter((x): x is AdicionPesoPayload => x !== null)
      );

      notifySuccess(
        `Mejor combinación calculada (${seleccionadosParaMezcla.length} lotes nuevos optimizados).`
      );
    },
    [blending, nuevosPendientes, notifyError, notifySuccess]
  );

  // ============== Cálculo de totales estimados (en vivo) ==============
  const valoresEstimados: TotalesEstimados = useMemo(() => {
    const items: ItemCalculable[] = [];

    // Detalles existentes (su peso_tomado original es fijo)
    blending?.detalles?.forEach((d) => {
      items.push({
        pesoUsado: d.peso_tomado,
        ley_humedad: d.ley_humedad,
        ley_oro: d.ley_oro,
        ley_plata: d.ley_plata,
      });
    });

    // Nuevos pendientes: buscar sus leyes y humedad en disponibles
    nuevosPendientes.forEach((p) => {
      const info = disponibles.find(
        (d) =>
          (p.id_lote_guia != null && d.id_lote_guia === p.id_lote_guia) ||
          (p.id_reblending != null && d.id_reblending === p.id_reblending)
      );
      if (info) {
        items.push({
          pesoUsado: p.peso_adicional,
          ley_humedad: info.ley_humedad,
          ley_oro: info.ley_oro,
          ley_plata: info.ley_plata,
        });
      }
    });

    return calcularTotales(items, precioOro, precioPlata);
  }, [blending, nuevosPendientes, disponibles, precioOro, precioPlata]);

  // ============== Detección de cambios ==============
  const hayCambios = useMemo(() => {
    if (!blending) return false;
    if (nuevosPendientes.length > 0) return true;
    if (evidenciasFiles.length > 0) return true;
    if (evidenciasEliminadas.length > 0) return true;
    if (precioOro !== 0 || precioPlata !== 0) return true;
    if (fechaHora && blending.fecha_hora_blending) {
      if (
        dayjs(fechaHora).format("YYYY-MM-DD HH:mm:ss") !==
        dayjs(blending.fecha_hora_blending).format("YYYY-MM-DD HH:mm:ss")
      )
        return true;
    }
    if ((observacion || "") !== (blending.observacion || "")) return true;
    return false;
  }, [
    blending,
    nuevosPendientes,
    evidenciasFiles,
    evidenciasEliminadas,
    fechaHora,
    observacion,
    precioOro,
    precioPlata,
  ]);

  // ============== Reset ==============
  const resetForm = useCallback(() => {
    setFechaHora(blending?.fecha_hora_blending ? new Date(blending.fecha_hora_blending) : null);
    setObservacion(blending?.observacion || "");
    setEvidenciasPersistidas(blending?.evidencias || []);
    setEvidenciasEliminadas([]);
    setEvidenciasFiles([]);
    setNuevosPendientes([]);
    setPrecioOro(0);
    setPrecioPlata(0);
  }, [blending]);

  const quitarEvidenciaPersistida = useCallback((path: string) => {
    setEvidenciasPersistidas((prev) =>
      prev.filter(
        (item) => item.path_relativo !== path && item.url !== path
      )
    );
    const nombre = path.split("/").pop() || "Evidencia";
    setEvidenciasEliminadas((prev) => [...prev, nombre]);
  }, []);

  // ============== Submit ==============
  const submit = async () => {
    if (!blending) return;
    if (!hayCambios) {
      notifyError("No hay cambios para guardar.");
      return;
    }

    // Construir arreglo de adiciones esperado por el backend
    const adiciones: AdicionPesoPayload[] = nuevosPendientes
      .filter((p) => p.peso_adicional > EPSILON)
      .map((p) => ({
        id_lote_guia: p.id_lote_guia ?? undefined,
        id_reblending: p.id_reblending ?? undefined,
        peso_adicional: Number(p.peso_adicional.toFixed(2)),
      }));

    const fechaHoraCambio =
      fechaHora && blending.fecha_hora_blending
        ? dayjs(fechaHora).format("YYYY-MM-DD HH:mm:ss") !==
          dayjs(blending.fecha_hora_blending).format("YYYY-MM-DD HH:mm:ss")
        : false;

    const nombresNuevos = evidenciasFiles.map((f) => f.name);
    const nombresEliminados = evidenciasEliminadas.map(
      (url) => url.split("/").pop() || "Evidencia"
    );

    const payload: EditarBlendingPayload = {
      fecha_hora_blending: fechaHoraCambio
        ? dayjs(fechaHora).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
      observacion: (observacion || "") !== (blending.observacion || "") ? observacion : undefined,
      evidencias_existentes: evidenciasPersistidas,
      evidencias_nuevas: evidenciasFiles,
      nombres_evidencias_nuevas: nombresNuevos.length > 0 ? nombresNuevos : undefined,
      nombres_evidencias_eliminadas: nombresEliminados.length > 0 ? nombresEliminados : undefined,
      adiciones: adiciones.length > 0 ? adiciones : undefined,
    };

    setLoading(true);
    try {
      await BlendingService.editar_blending(blending.id, payload);
      notifySuccess("Blending actualizado exitosamente.");
      if (onSuccess) onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al editar el blending.";
      notifyError(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    // Estado
    fechaHora,
    setFechaHora,
    observacion,
    setObservacion,
    evidenciasPersistidas,
    evidenciasFiles,
    setEvidenciasFiles,
    nuevosPendientes,
    precioOro,
    setPrecioOro,
    precioPlata,
    setPrecioPlata,

    // Derivados
    valoresEstimados,
    hayCambios,

    // Acciones
    quitarEvidenciaPersistida,
    actualizarNuevoPendiente,
    agregarNuevoPendiente,
    quitarNuevoPendiente,
    aplicarMejorCombinacion,
    resetForm,
    submit,
    loading,
  };
};