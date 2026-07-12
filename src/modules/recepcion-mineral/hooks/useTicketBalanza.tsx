import { useCallback, useMemo } from "react";
import { usePrint } from "../../../hooks/usePrint";
import { TicketBalanzaPdf } from "../presentation/components/ticket-balanza-pdf";

export interface LoteBalanzaInfo {
  id: number;
  correlativo: string;
  numero_correlativo: number;
  vehiculo_placa: string | null;
  vehiculo_serie: string | null;
  tipo_carga: string | null;
  empresa_transporte_ruc?: string | null;
  empresa_transporte_razon_social: string | null;
  tipo_vehiculo_nombre: string | null;
  conductor_nombre_completo: string | null;
  proveedor_nombre?: string | null;
  observacion_peso_inicial?: string | null;
  observacion_peso_final?: string | null;
  peso_inicial: number | null;
  fecha_hora_peso_inicial: string | null;
  peso_final: number | null;
  fecha_hora_peso_final: string | null;
  peso_neto: number | null;
}

/**
 * Hook exclusivo para imprimir el ticket de balanza vertical (67 x 247 mm).
 */
export const useTicketBalanza = () => {
  const { print, prepare } = usePrint();

  const printTicketBalanza = useCallback(
    (lote: LoteBalanzaInfo) => {
      if (!lote?.correlativo) return;

      prepare(`ticket-balanza-${lote.id}`);

      print(
        <TicketBalanzaPdf lote={lote} />,
        {
          documentTitle: `Ticket Balanza ${lote.correlativo}`,
          target: `ticket-balanza-${lote.id}`,
        }
      );
    },
    [print, prepare]
  );

  return useMemo(
    () => ({
      printTicketBalanza,
    }),
    [printTicketBalanza]
  );
};
