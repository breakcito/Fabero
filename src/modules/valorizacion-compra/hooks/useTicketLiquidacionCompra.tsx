import { useCallback, useMemo, useState } from "react";
import { TicketLiquidacionCompraPdf } from "../presentation/utils/ticket-liquidacion-compra-pdf";
import { ValorizacionCompraService } from "../service/valorizacion-compra.service";
import type { RES_ValorizacionCompra } from "../service/valorizacion-compra.responses";
import { useNotify } from "../../../hooks/useNotify";
import { usePrint } from "../../../hooks/usePrint";

/**
 * Hook para imprimir la Liquidación de Valorización de Compra (A4 Landscape / réplica corporativa).
 * Utiliza el portal global de impresión (`GlobalPrinterPortal`) a través de `usePrint`.
 *
 * `printTicketLiquidacion` emite la liquidación normal.
 * `printTicketDirimencia` emite el ticket por dirimencia: mismo documento con el
 * título "POR DIRIMENCIA", el correlativo propio (DRD-AA-NNNNN) y el bloque de
 * notas de crédito/débito. Solo aplica a valorizaciones con `con_dirimencia`.
 */
export const useTicketLiquidacionCompra = () => {
  const { print, prepare } = usePrint();
  const { notifyError, notifySuccess } = useNotify();
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [printingId, setPrintingId] = useState<number | null>(null);

  const imprimir = useCallback(
    async (
      idOrData: number | RES_ValorizacionCompra,
      esDirimencia: boolean,
    ) => {
      const targetId = typeof idOrData === "number" ? idOrData : idOrData.id;
      setLoadingTicket(true);
      setPrintingId(targetId);
      try {
        let valorizacion: RES_ValorizacionCompra;

        if (typeof idOrData === "number") {
          const target = `ticket-liquidacion-${idOrData}${esDirimencia ? "-dir" : ""}`;
          prepare(target);
          const res = await ValorizacionCompraService.obtenerValorizacion(targetId);
          if (!res.data) {
            throw new Error(res.message || "No se pudo obtener la valorización");
          }
          valorizacion = res.data;
          print(<TicketLiquidacionCompraPdf data={valorizacion} esDirimencia={esDirimencia} />, {
            documentTitle: `${esDirimencia ? "Dirimencia" : "Liquidación"} ${valorizacion.correlativo_dirimencia || valorizacion.correlativo || `VAL-${valorizacion.id}`} - v${valorizacion.numero_version ?? 1}`,
            target,
          });
        } else {
          valorizacion = idOrData;
          const target = `ticket-liquidacion-${valorizacion.id}${esDirimencia ? "-dir" : ""}`;
          prepare(target);
          if (!valorizacion.proveedor_direccion && !valorizacion.guia_remitente) {
            const res = await ValorizacionCompraService.obtenerValorizacion(valorizacion.id);
            if (res.data) {
              valorizacion = res.data;
            }
          }
          print(<TicketLiquidacionCompraPdf data={valorizacion} esDirimencia={esDirimencia} />, {
            documentTitle: `${esDirimencia ? "Dirimencia" : "Liquidación"} ${valorizacion.correlativo_dirimencia || valorizacion.correlativo || `VAL-${valorizacion.id}`} - v${valorizacion.numero_version ?? 1}`,
            target,
          });
        }

        notifySuccess(
          esDirimencia
            ? "Ticket de dirimencia generado. Revisa la nueva ventana del navegador."
            : "Liquidación generada. Revisa la nueva ventana del navegador.",
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        notifyError(`Error al imprimir la liquidación: ${message}`);
        console.error("[TicketLiquidacionCompra] Error:", err);
      } finally {
        setLoadingTicket(false);
        setPrintingId(null);
      }
    },
    [print, prepare, notifyError, notifySuccess],
  );

  const printTicketLiquidacion = useCallback(
    async (idOrData: number | RES_ValorizacionCompra) => {
      await imprimir(idOrData, false);
    },
    [imprimir],
  );

  const printTicketDirimencia = useCallback(
    async (idOrData: number | RES_ValorizacionCompra) => {
      await imprimir(idOrData, true);
    },
    [imprimir],
  );

  return useMemo(
    () => ({
      printTicketLiquidacion,
      printTicketDirimencia,
      loadingTicket,
      printingId,
    }),
    [printTicketLiquidacion, printTicketDirimencia, loadingTicket, printingId],
  );
};
