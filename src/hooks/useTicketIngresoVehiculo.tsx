import { useCallback, useMemo, useState } from "react";
import { TicketIngresoVehiculoPdf } from "../presentation/utils/ticket-ingreso-vehiculo-pdf";
import { TicketIngresoService } from "../service/ticket-ingreso.service";
import type { RES_TicketIngresoVehiculoData } from "../service/responses/ticket-ingreso-vehiculo";
import { useNotify } from "./useNotify";
import { usePrint } from "./usePrint";

/**
 * Hook global para imprimir el "Ticket de Ingreso de Vehículos con Carga"
 * (A5 horizontal / mitad de hoja).
 *
 * Utiliza el portal global de impresión (`GlobalPrinterPortal`) a través de
 * `usePrint`. Es global porque el ticket lo consumen varios módulos:
 * recepción de unidades y programación de recepción.
 */
export const useTicketIngresoVehiculo = () => {
  const { print, prepare } = usePrint();
  const { notifyError } = useNotify();
  const [loadingTicket, setLoadingTicket] = useState(false);

  const printTicketIngreso = useCallback(
    async (idRecepcionUnidad: number, idGuia?: number) => {
      if (!idRecepcionUnidad) return;
      setLoadingTicket(true);
      try {
        const target = `ticket-ingreso-${idRecepcionUnidad}${idGuia ? `-${idGuia}` : ""}`;
        prepare(target);
        const data: RES_TicketIngresoVehiculoData =
          await TicketIngresoService.getTicketIngreso(
            idRecepcionUnidad,
            idGuia,
          );

        print(<TicketIngresoVehiculoPdf data={data} />, {
          documentTitle: `Ticket de Ingreso ${data.tiv || data.correlativo}`,
          target,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        notifyError(`Error al imprimir el ticket de ingreso: ${message}`);
        console.error("[TicketIngreso] Error:", err);
      } finally {
        setLoadingTicket(false);
      }
    },
    [print, prepare, notifyError],
  );

  return useMemo(
    () => ({
      printTicketIngreso,
      loadingTicket,
    }),
    [printTicketIngreso, loadingTicket],
  );
};
