import { useState, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import type { ItemDisponibleResponse } from "../service/blending.responses";
import type { CrearBlendingPayload } from "../service/blending.requests";
import { BlendingService } from "../service/blending.service";
import { useNotify } from "../../../hooks/useNotify";

export interface ItemSeleccionado {
  item: ItemDisponibleResponse;
  peso_tomado: number;
}

export const useRegistroBlending = (onSuccess?: () => void) => {
  const [seleccionados, setSeleccionados] = useState<ItemSeleccionado[]>([]);
  const [fechaHoraBlending, setFechaHoraBlending] = useState<Date | null>(new Date());
  const [observacion, setObservacion] = useState<string>("");
  const [evidencias, setEvidencias] = useState<string[]>([]);
  const [evidenciasFiles, setEvidenciasFiles] = useState<File[]>([]);
  const [precioOro, setPrecioOro] = useState<number>(0);
  const [precioPlata, setPrecioPlata] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const { notifySuccess, notifyError } = useNotify();

  // Agregar un lote/blending a la lista de seleccionados
  const agregarItem = useCallback((item: ItemDisponibleResponse) => {
    setSeleccionados((prev) => {
      // Verificar si ya fue agregado
      const existe = prev.some((s) =>
        item.tipo_origen === "lote"
          ? s.item.id_lote_guia === item.id_lote_guia
          : s.item.id_reblending === item.id_reblending
      );
      if (existe) return prev;

      return [
        ...prev,
        {
          item,
          peso_tomado: item.tmh_disponible,
        },
      ];
    });
  }, []);

  // Remover un item de los seleccionados
  const removerItem = useCallback((item: ItemDisponibleResponse) => {
    setSeleccionados((prev) =>
      prev.filter((s) =>
        item.tipo_origen === "lote"
          ? s.item.id_lote_guia !== item.id_lote_guia
          : s.item.id_reblending !== item.id_reblending
      )
    );
  }, []);

  // Cambiar peso a tomar de un item seleccionado
  const setPesoTomado = useCallback((item: ItemDisponibleResponse, nuevoPeso: number) => {
    setSeleccionados((prev) =>
      prev.map((s) => {
        const esMismo =
          item.tipo_origen === "lote"
            ? s.item.id_lote_guia === item.id_lote_guia
            : s.item.id_reblending === item.id_reblending;

        if (!esMismo) return s;

        const pesoValidado = Math.max(0, Math.min(nuevoPeso, s.item.tmh_disponible));
        return { ...s, peso_tomado: pesoValidado };
      })
    );
  }, []);

  // Limpiar selección
  const resetForm = useCallback(() => {
    setSeleccionados([]);
    setFechaHoraBlending(new Date());
    setObservacion("");
    setEvidencias([]);
    setPrecioOro(0);
    setPrecioPlata(0);
  }, []);

  // Cálculos en tiempo real de Valores Estimados
  const valoresEstimados = useMemo(() => {
    let pesoHumedoTotal = 0;
    let pesoSecoTotal = 0;
    let sumAuTMS = 0;
    let sumAgTMS = 0;
    const humedades: number[] = [];

    seleccionados.forEach(({ item, peso_tomado }) => {
      const tmsTomado = peso_tomado * (1 - item.ley_humedad / 100);
      pesoHumedoTotal += peso_tomado;
      pesoSecoTotal += tmsTomado;
      sumAuTMS += tmsTomado * item.ley_oro;
      sumAgTMS += tmsTomado * item.ley_plata;
      humedades.push(item.ley_humedad);
    });

    const leyOro = pesoSecoTotal > 0 ? sumAuTMS / pesoSecoTotal : 0;
    const leyPlata = pesoSecoTotal > 0 ? sumAgTMS / pesoSecoTotal : 0;
    const leyHumedad = humedades.length > 0 ? humedades.reduce((a, b) => a + b, 0) / humedades.length : 0;

    // Cálculo comercial estimado (Valor Au y Valor Ag en USD)
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
  }, [seleccionados, precioOro, precioPlata]);

  // Algoritmo de optimización para la "Mejor Combinación" entre los Lotes Seleccionados
  const aplicarMejorCombinacion = useCallback(
    (lotesObjetivo: ItemDisponibleResponse[], leyMinOro: number, leyMinPlata: number, pesoMaxResultante: number) => {
      if (lotesObjetivo.length === 0) {
        notifyError("Agregue al menos 1 lote a 'Lotes Seleccionados' antes de usar la Mejor Combinación.");
        return;
      }
      if (pesoMaxResultante <= 0) {
        notifyError("El peso máximo resultante debe ser mayor a 0.");
        return;
      }

      // 1. Filtrar lotes disponibles con stock > 0
      const conStock = lotesObjetivo.filter((i) => i.tmh_disponible > 0);
      if (conStock.length === 0) return;

      // 2. Si se solicitan leyes mínimas, filtrar o priorizar lotes que cumplan/aporten a la ley
      let candidatos = conStock.filter(
        (i) =>
          (leyMinOro > 0 ? i.ley_oro >= leyMinOro * 0.7 : true) &&
          (leyMinPlata > 0 ? i.ley_plata >= leyMinPlata * 0.7 : true)
      );

      if (candidatos.length === 0) {
        candidatos = [...conStock];
      }

      // Ordenar por puntaje de ley combinado (Au prioridad mayor + Ag)
      candidatos.sort((a, b) => {
        const scoreA = a.ley_oro * 2 + a.ley_plata;
        const scoreB = b.ley_oro * 2 + b.ley_plata;
        return scoreB - scoreA;
      });

      // 3. Tomar los mejores lotes candidatos (hasta 6 lotes para mezclar)
      const seleccionadosParaMezcla = candidatos.slice(0, Math.min(candidatos.length, 6));

      // 4. Repartir el pesoMaxResultante equilibradamente entre los lotes seleccionados
      const seleccionOptima: ItemSeleccionado[] = [];
      const count = seleccionadosParaMezcla.length;

      if (count === 1) {
        // Solo hay 1 lote disponible
        const item = seleccionadosParaMezcla[0];
        const pesoATomar = Math.min(item.tmh_disponible, pesoMaxResultante);
        seleccionOptima.push({ item, peso_tomado: Number(pesoATomar.toFixed(2)) });
      } else {
        // Hay 2 o más lotes: forzar mezcla impidiendo que un solo lote tome el 100%
        const capMaxPorLote = pesoMaxResultante * 0.65;
        const pesosAsignados = new Map<string, number>();

        // Asignación inicial proporcional al stock de cada lote
        const sumaDisponible = seleccionadosParaMezcla.reduce((acc, curr) => acc + curr.tmh_disponible, 0);

        for (const item of seleccionadosParaMezcla) {
          const key = `${item.tipo_origen}-${item.codigo}`;
          const proporcion = item.tmh_disponible / (sumaDisponible || 1);
          const pesoIdeal = pesoMaxResultante * proporcion;

          // Limitar por stock disponible y cap por lote para forzar combinación
          const pesoFinal = Math.min(pesoIdeal, item.tmh_disponible, capMaxPorLote);
          pesosAsignados.set(key, pesoFinal);
        }

        // Si falta peso por cubrir para alcanzar pesoMaxResultante, distribuir remanente
        const sumaAsignada = Array.from(pesosAsignados.values()).reduce((a, b) => a + b, 0);

        if (sumaAsignada < pesoMaxResultante) {
          let remanente = pesoMaxResultante - sumaAsignada;
          for (const item of seleccionadosParaMezcla) {
            if (remanente <= 0.001) break;
            const key = `${item.tipo_origen}-${item.codigo}`;
            const actual = pesosAsignados.get(key) || 0;
            const margenStock = item.tmh_disponible - actual;
            if (margenStock > 0) {
              const sumar = Math.min(margenStock, remanente);
              pesosAsignados.set(key, actual + sumar);
              remanente -= sumar;
            }
          }
        }

        // Construir resultado final
        for (const item of seleccionadosParaMezcla) {
          const key = `${item.tipo_origen}-${item.codigo}`;
          const peso = pesosAsignados.get(key) || 0;
          if (peso > 0.01) {
            seleccionOptima.push({
              item,
              peso_tomado: Number(peso.toFixed(2)),
            });
          }
        }
      }

      setSeleccionados(seleccionOptima);
      notifySuccess(`Mejor combinación calculada (${seleccionOptima.length} lotes mezclados).`);
    },
    [notifySuccess, notifyError]
  );

  // Enviar submit a la API
  const submit = async () => {
    if (seleccionados.length === 0) {
      notifyError("Debe seleccionar al menos un lote o blending.");
      return;
    }

    const payload: CrearBlendingPayload = {
      fecha_hora_blending: fechaHoraBlending
        ? dayjs(fechaHoraBlending).format("YYYY-MM-DD HH:mm:ss")
        : undefined,
      observacion,
      evidencias: evidenciasFiles,
      detalles: seleccionados.map((s) => ({
        id_lote_guia: s.item.tipo_origen === "lote" ? s.item.id_lote_guia : null,
        id_reblending: s.item.tipo_origen === "blending" ? s.item.id_reblending : null,
        peso_tomado: s.peso_tomado,
      })),
    };

    setLoading(true);
    try {
      await BlendingService.crear_blending(payload);
      notifySuccess("Blending registrado exitosamente.");
      resetForm();
      if (onSuccess) onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrar el blending.";
      notifyError(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    seleccionados,
    fechaHoraBlending,
    setFechaHoraBlending,
    observacion,
    setObservacion,
    evidencias,
    setEvidencias,
    evidenciasFiles,
    setEvidenciasFiles,
    precioOro,
    setPrecioOro,
    precioPlata,
    setPrecioPlata,
    valoresEstimados,
    agregarItem,
    removerItem,
    setPesoTomado,
    aplicarMejorCombinacion,
    resetForm,
    submit,
    loading,
  };
};
