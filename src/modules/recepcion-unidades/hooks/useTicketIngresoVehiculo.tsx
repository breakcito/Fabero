import { useCallback, useMemo, useState } from "react";
import { TicketIngresoVehiculoPdf } from "../presentation/utils/ticket-ingreso-vehiculo-pdf";
import { RecepcionUnidadesService } from "../service/recepcion-unidades.service";
import type { TicketIngresoVehiculoData } from "../service/recepcion-unidades.responses";
import { useNotify } from "../../../hooks/useNotify";
import { usePrint } from "../../../hooks/usePrint";

/**
 * Hook para imprimir el "Ticket de Ingreso de Vehículos con Carga" (A5 horizontal / mitad de hoja).
 * Utiliza el portal global de impresión (`GlobalPrinterPortal`) a través de `usePrint`.
 */
export const useTicketIngresoVehiculo = () => {
  const { print, prepare } = usePrint();
  const { notifyError, notifySuccess } = useNotify();
  const [loadingTicket, setLoadingTicket] = useState(false);

  const printTicketIngreso = useCallback(
    async (idRecepcionUnidad: number) => {
      if (!idRecepcionUnidad) return;
      setLoadingTicket(true);
      try {
        const target = `ticket-ingreso-${idRecepcionUnidad}`;
        prepare(target);
        const data: TicketIngresoVehiculoData =
          await RecepcionUnidadesService.getTicketIngreso(idRecepcionUnidad);

        print(<TicketIngresoVehiculoPdf data={data} />, {
          documentTitle: `Ticket de Ingreso ${data.tiv || data.correlativo}`,
          target,
        });
        notifySuccess("Ticket de ingreso generado. Revisa la nueva ventana del navegador.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        notifyError(`Error al imprimir el ticket de ingreso: ${message}`);
        console.error("[TicketIngreso] Error:", err);
      } finally {
        setLoadingTicket(false);
      }
    },
    [print, prepare, notifyError, notifySuccess],
  );

  return useMemo(
    () => ({
      printTicketIngreso,
      loadingTicket,
    }),
    [printTicketIngreso, loadingTicket],
  );
};
