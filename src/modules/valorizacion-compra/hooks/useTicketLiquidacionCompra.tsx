import { useCallback, useMemo, useState } from "react";
import { TicketLiquidacionCompraPdf } from "../presentation/utils/ticket-liquidacion-compra-pdf";
import { ValorizacionCompraService } from "../service/valorizacion-compra.service";
import type { RES_ValorizacionCompra } from "../service/valorizacion-compra.responses";
import { useNotify } from "../../../hooks/useNotify";
import { usePrint } from "../../../hooks/usePrint";

/**
 * Hook para imprimir la Liquidación de Valorización de Compra (A4 Landscape / réplica corporativa).
 * Utiliza el portal global de impresión (`GlobalPrinterPortal`) a través de `usePrint`.
 */
export const useTicketLiquidacionCompra = () => {
  const { print, prepare } = usePrint();
  const { notifyError, notifySuccess } = useNotify();
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [printingId, setPrintingId] = useState<number | null>(null);

  const printTicketLiquidacion = useCallback(
    async (idOrData: number | RES_ValorizacionCompra) => {
      const targetId = typeof idOrData === "number" ? idOrData : idOrData.id;
      setLoadingTicket(true);
      setPrintingId(targetId);
      try {
        let valorizacion: RES_ValorizacionCompra;

        if (typeof idOrData === "number") {
          const target = `ticket-liquidacion-${idOrData}`;
          prepare(target);
          const res = await ValorizacionCompraService.obtenerValorizacion(idOrData);
          if (!res.data) {
            throw new Error(res.message || "No se pudo obtener la valorización");
          }
          valorizacion = res.data;
          print(<TicketLiquidacionCompraPdf data={valorizacion} />, {
            documentTitle: `Liquidación ${valorizacion.correlativo || `VAL-${valorizacion.id}`} - v${valorizacion.numero_version ?? 1}`,
            target,
          });
        } else {
          valorizacion = idOrData;
          const target = `ticket-liquidacion-${valorizacion.id}`;
          prepare(target);
          if (!valorizacion.proveedor_direccion && !valorizacion.guia_remitente) {
            const res = await ValorizacionCompraService.obtenerValorizacion(valorizacion.id);
            if (res.data) {
              valorizacion = res.data;
            }
          }
          print(<TicketLiquidacionCompraPdf data={valorizacion} />, {
            documentTitle: `Liquidación ${valorizacion.correlativo || `VAL-${valorizacion.id}`} - v${valorizacion.numero_version ?? 1}`,
            target,
          });
        }

        notifySuccess("Liquidación generada. Revisa la nueva ventana del navegador.");
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

  return useMemo(
    () => ({
      printTicketLiquidacion,
      loadingTicket,
      printingId,
    }),
    [printTicketLiquidacion, loadingTicket, printingId],
  );
};
