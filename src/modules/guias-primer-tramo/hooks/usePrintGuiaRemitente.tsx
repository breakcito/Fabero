import { useCallback, useState } from "react";
import { usePrint } from "../../../hooks/usePrint";
import QRCode from "qrcode";
import { GuiaRemitentePdf } from "../presentation/components/guia-remitente-pdf";
import type { RES_GuiaPrimerTramo } from "../service/guias-primer-tramo.responses";

/**
 * Hook para manejar la generación del PDF de la Guía de Remisión Remitente,
 * la creación del código QR correspondiente y el envío al portal de impresión.
 */
export const usePrintGuiaRemitente = () => {
  const { print, prepare } = usePrint();
  const [printingId, setPrintingId] = useState<number | null>(null);

  const printGuia = useCallback(
    async (guia: RES_GuiaPrimerTramo) => {
      if (!guia) return;
      setPrintingId(guia.id);
      prepare(`guia-remitente-${guia.id}`);

      try {
        // En guia_remitente.php se generaba una URL en el QR.
        // Si hay token de QR de remitente en la base de datos lo usamos,
        // de lo contrario armamos la cadena con la serie y número de guía.
        const qrText =
          guia.qr_token_remitente ||
          `Guia Remitente: ${guia.serie_guia_remitente ?? ""}-${guia.numero_guia_remitente ?? ""}`;

        // Generar QR en base64 de forma asíncrona
        const qrCodeUrl = await QRCode.toDataURL(qrText, {
          margin: 1,
          width: 150,
        });

        print(
          <GuiaRemitentePdf guia={guia} qrCodeUrl={qrCodeUrl} />,
          {
            documentTitle: `Guia_Remitente_${guia.serie_guia_remitente ?? ""}_${guia.numero_guia_remitente ?? ""}`,
            target: `guia-remitente-${guia.id}`,
          }
        );
      } catch (error) {
        console.error("Error al generar PDF de Guía Remitente", error);
      } finally {
        setPrintingId(null);
      }
    },
    [print, prepare]
  );

  return {
    printGuia,
    isPrinting: printingId !== null,
    printingId,
  };
};
