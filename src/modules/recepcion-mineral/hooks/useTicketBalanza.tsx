import { useCallback, useMemo, useState } from "react";
import { usePrint } from "../../../hooks/usePrint";
import { TicketBalanzaPdf } from "../presentation/components/ticket-balanza-pdf";
import { RecepcionMineralService } from "../service/recepcion-mineral.service";
import type { RES_TicketBalanzaData } from "../service/recepcion-mineral.responses";

export type LoteBalanzaInput = number | { id?: number; id_lote?: number; correlativo?: string };

/**
 * Hook exclusivo para imprimir el ticket de balanza vertical (67 x 247 mm).
 */
export const useTicketBalanza = () => {
  const { print, prepare } = usePrint();
  const [loadingTicket, setLoadingTicket] = useState(false);

  const printTicketBalanza = useCallback(
    async (loteInput: LoteBalanzaInput) => {
      const loteId = typeof loteInput === "number" ? loteInput : (loteInput.id || loteInput.id_lote);
      if (!loteId) return;

      setLoadingTicket(true);
      try {
        const ticketData: RES_TicketBalanzaData = await RecepcionMineralService.obtener_ticket_balanza(loteId);

        const targetId = `ticket-balanza-${loteId}`;
        prepare(targetId);

        print(
          <TicketBalanzaPdf data={ticketData} />,
          {
            documentTitle: `Ticket Balanza ${ticketData.correlativo || loteId}`,
            target: targetId,
          }
        );
      } catch (error) {
        console.error("Error al obtener información para el Ticket de Balanza:", error);
      } finally {
        setLoadingTicket(false);
      }
    },
    [print, prepare]
  );

  return useMemo(
    () => ({
      printTicketBalanza,
      loadingTicket,
    }),
    [printTicketBalanza, loadingTicket]
  );
};
