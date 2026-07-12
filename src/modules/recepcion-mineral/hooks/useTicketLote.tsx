import { useCallback, useMemo } from "react";
import { usePrint } from "../../../hooks/usePrint";
import { get_url_barcode } from "../../../shared/functions/get-url-barcode";
import { TicketLotePdf } from "../presentation/components/ticket-lote-pdf";

export interface LoteTicketInfo {
  id: number;
  correlativo: string;
  fecha_hora_registro?: string;
  created_at?: string;
}

const formatFechaHora = (isoString: string): string => {
  if (!isoString) return "";
  const date = new Date(isoString.includes("T") ? isoString : isoString.replace(" ", "T"));
  if (isNaN(date.getTime())) return isoString;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const buildBarcodeUrl = (value: string): string =>
  get_url_barcode(value, {
    format: "CODE128",
    displayValue: false,
    height: 40,
    margin: 0,
    width: 1.4,
  });

/**
 * Hook que orquesta la generación de los códigos de barras y el envío
 * del ticket PDF de análisis de humedad (TicketLotePdf) al portal global de impresión.
 */
export const useTicketLote = () => {
  const { print, prepare } = usePrint();

  const printTicket = useCallback(
    (lote: LoteTicketInfo) => {
      if (!lote?.correlativo) return;

      prepare(`ticket-lote-${lote.id}`);

      const correlativo = lote.correlativo;
      const fechaHora = formatFechaHora(lote.fecha_hora_registro || lote.created_at || "");

      const barcodeAUrl = buildBarcodeUrl(`${correlativo}.A`);
      const barcodeBUrl = buildBarcodeUrl(`${correlativo}.B`);

      print(
        <TicketLotePdf
          correlativo={correlativo}
          fechaHoraRegistro={fechaHora}
          barcodeAUrl={barcodeAUrl}
          barcodeBUrl={barcodeBUrl}
        />,
        {
          documentTitle: `Ticket ${correlativo}`,
          target: `ticket-lote-${lote.id}`,
        }
      );
    },
    [print, prepare]
  );

  /**
   * Devuelve la URL del código de barras para mostrar en la tabla,
   * sin necesidad de renderizar el PDF completo.
   */
  const getBarcodePreviewUrl = useCallback(
    (lote: { correlativo: string }): string => {
      if (!lote?.correlativo) return "";
      return buildBarcodeUrl(lote.correlativo);
    },
    []
  );

  return useMemo(
    () => ({
      printTicket,
      getBarcodePreviewUrl,
    }),
    [printTicket, getBarcodePreviewUrl]
  );
};
