import { useCallback, useState } from "react";
import { usePrint } from "../../../hooks/usePrint";
import QRCode from "qrcode";
import { GuiaTransportistaPdf } from "../presentation/components/guia-transportista-pdf";
import type { RES_GuiaPrimerTramo } from "../service/guias-primer-tramo.responses";
import { AuxService } from "../../../service/auxiliar.service";

/**
 * Hook para manejar la generación del PDF de la Guía de Remisión Transportista,
 * la creación del código QR correspondiente y el envío al portal de impresión.
 */
export const usePrintGuiaTransportista = () => {
  const { print, prepare } = usePrint();
  const [printingId, setPrintingId] = useState<number | null>(null);

  const printGuiaTransportista = useCallback(
    async (guia: RES_GuiaPrimerTramo) => {
      if (!guia) return;
      setPrintingId(guia.id);
      prepare(`guia-transportista-${guia.id}`);

      try {
        // Cargar el RUC del transportista de forma dinámica
        let rucTransportista: string | null = null;
        if (guia.id_empresa_transporte) {
          try {
            const empresas = await AuxService.get_empresas_transporte();
            const encontrada = empresas.find(
              (e) => e.id_empresa_transporte === guia.id_empresa_transporte
            );
            if (encontrada) {
              rucTransportista = encontrada.ruc;
            }
          } catch (err) {
            console.error("Error al obtener RUC de empresa de transporte", err);
          }
        }

        // Generar QR a partir de qr_token_transportista si existe
        const qrText =
          guia.qr_token_transportista ||
          `Guia Transportista: ${guia.serie_guia_transportista ?? ""}-${guia.numero_guia_transportista ?? ""}`;

        // Generar QR en base64 de forma asíncrona
        const qrCodeUrl = await QRCode.toDataURL(qrText, {
          margin: 1,
          width: 150,
        });

        print(
          <GuiaTransportistaPdf
            guia={guia}
            qrCodeUrl={qrCodeUrl}
            rucTransportista={rucTransportista}
          />,
          {
            documentTitle: `Guia_Transportista_${guia.serie_guia_transportista ?? ""}_${guia.numero_guia_transportista ?? ""}`,
            target: `guia-transportista-${guia.id}`,
          }
        );
      } catch (error) {
        console.error("Error al generar PDF de Guía Transportista", error);
      } finally {
        setPrintingId(null);
      }
    },
    [print, prepare]
  );

  return {
    printGuiaTransportista,
    isPrinting: printingId !== null,
    printingId,
  };
};
