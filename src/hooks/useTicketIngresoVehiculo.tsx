import { useCallback, useMemo, useState } from "react";
import { TicketIngresoVehiculoPdf } from "../presentation/utils/ticket-ingreso-vehiculo-pdf";
import { TicketIngresoService } from "../service/ticket-ingreso.service";
import type {
  RES_TicketIngresoDisponible,
  RES_TicketIngresoVehiculoData,
} from "../service/responses/ticket-ingreso-vehiculo";
import { usePrint } from "./usePrint";

/**
 * Hook global para imprimir el "Ticket de Ingreso de Vehículos con Carga"
 * (A5 horizontal / mitad de hoja).
 *
 * Utiliza el portal global de impresión (`GlobalPrinterPortal`) a través de
 * `usePrint`. Es global porque el ticket lo consumen varios módulos:
 * recepción de unidades y programación de recepción.
 *
 * Una unidad puede traer la carga de varios proveedores: el ticket se arma
 * con UN proveedor (el elegido por el operador), por eso `idProveedor` se
 * envía al backend junto con `idGuia`.
 *
 * Ver el ticket NO dispara ninguna notificación: el documento se abre
 * directamente en la ventana de impresión.
 */
export const useTicketIngresoVehiculo = () => {
  const { print, prepare } = usePrint();
  const [loadingTicket, setLoadingTicket] = useState(false);

  const printTicketIngreso = useCallback(
    async (
      idRecepcionUnidad: number,
      idGuia?: number | null,
      idProveedor?: number | null,
    ) => {
      if (!idRecepcionUnidad) return;
      setLoadingTicket(true);
      try {
        const target = `ticket-ingreso-${idRecepcionUnidad}${
          idGuia ? `-${idGuia}` : ""
        }${idProveedor ? `-p${idProveedor}` : ""}`;
        prepare(target);
        const data: RES_TicketIngresoVehiculoData =
          await TicketIngresoService.getTicketIngreso(
            idRecepcionUnidad,
            idGuia,
            idProveedor,
          );

        print(<TicketIngresoVehiculoPdf data={data} />, {
          documentTitle: `Ticket de Ingreso ${data.tiv || data.correlativo}`,
          target,
        });
      } catch (err) {
        console.error("[TicketIngreso] Error:", err);
      } finally {
        setLoadingTicket(false);
      }
    },
    [print, prepare],
  );

  /**
   * Imprime el ticket de ingreso de una unidad según sus proveedores.
   *
   * - Un solo ticket disponible → se imprime directo con ese proveedor.
   * - Ningún ticket disponible → se imprime el ticket genérico de la unidad.
   * - Varios tickets → se delegan en `onSeleccionar` para que el operador
   *   elija a qué proveedor corresponde el ticket a imprimir.
   */
  const imprimirTicketPorProveedor = useCallback(
    async (
      idRecepcionUnidad: number,
      onSeleccionar: (tickets: RES_TicketIngresoDisponible[]) => void,
    ): Promise<void> => {
      try {
        const tickets = await TicketIngresoService.getTicketsIngreso(
          idRecepcionUnidad,
        );

        if (tickets.length === 1) {
          await printTicketIngreso(
            idRecepcionUnidad,
            tickets[0].id_guia_primer_tramo,
            tickets[0].id_proveedor,
          );
          return;
        }

        if (tickets.length === 0) {
          await printTicketIngreso(idRecepcionUnidad);
          return;
        }

        onSeleccionar(tickets);
      } catch (err) {
        console.error(
          "[TicketIngreso] Error al obtener los tickets por proveedor:",
          err,
        );
        await printTicketIngreso(idRecepcionUnidad);
      }
    },
    [printTicketIngreso],
  );

  return useMemo(
    () => ({
      printTicketIngreso,
      imprimirTicketPorProveedor,
      loadingTicket,
    }),
    [printTicketIngreso, imprimirTicketPorProveedor, loadingTicket],
  );
};
