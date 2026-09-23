import { useCallback, useMemo, useState } from "react";
import { ActaSalidaPdf } from "../presentation/utils/acta-salida-pdf";
import { ProgramacionDespachosService } from "../service/programacion-despachos.service";
import type { ActaSalidaVehiculoData } from "../service/programacion-despachos.responses";
import { useNotify } from "../../../hooks/useNotify";
import { usePrint } from "../../../hooks/usePrint";

/**
 * Hook para imprimir el "Acta de Salida de Vehículos con Carga" (A5 horizontal).
 *
 * Sigue el mismo patrón que `useTicketBalanza`:
 * 1. `prepare(target)` abre una ventana con pantalla de carga.
 * 2. `print(<ActaSalidaPdf />, { target })` encola el render del PDF en el
 *    portal global (`GlobalPrinterPortal`) que muestra el documento en esa
 *    misma ventana.
 *
 * Reutilizar el target (`acta-salida-${id}`) entre llamadas refresca el acta
 * en la misma ventana en vez de abrir una nueva.
 */
export const useActaSalidaVehiculo = () => {
  const { print, prepare } = usePrint();
  const { notifyError, notifySuccess } = useNotify();
  const [loadingActa, setLoadingActa] = useState(false);

  const printInternal = useCallback(
    async (idKey: string, fetchData: () => Promise<ActaSalidaVehiculoData>) => {
      setLoadingActa(true);
      try {
        const target = `acta-salida-${idKey}`;
        prepare(target);
        const acta = await fetchData();
        print(<ActaSalidaPdf data={acta} />, {
          documentTitle: `Acta de Salida ${acta.correlativo}`,
          target,
        });
        notifySuccess("Acta de salida generada. Revisa la nueva ventana del navegador.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        notifyError(`Error al imprimir el acta: ${message}`);
        console.error("[ActaSalida] Error:", err);
      } finally {
        setLoadingActa(false);
      }
    },
    [print, prepare, notifyError, notifySuccess],
  );

  /**
   * Abre el acta de salida de una distribución existente (botón "Ver acta").
   */
  const printActaSalida = useCallback(
    (idDistribucion: number) => {
      if (!idDistribucion) return;
      void printInternal(String(idDistribucion), () =>
        ProgramacionDespachosService.getActaSalida(idDistribucion),
      );
    },
    [printInternal],
  );

  return useMemo(
    () => ({
      printActaSalida,
      loadingActa,
    }),
    [printActaSalida, loadingActa],
  );
};
