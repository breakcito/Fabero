import { useCallback } from "react";
import { usePrint } from "../../../hooks/usePrint";
import { ReporteCierreLeyesPdf } from "../presentation/components/reporte-cierre-leyes-pdf";
import type { LoteCierreResponse } from "../service/cierre-leyes.responses";

const TARGET_NAME = "reporte-cierre-leyes";

export const useReporteCierreLeyes = () => {
  const { print, prepare } = usePrint();

  /**
   * Encola el PDF con los lotes indicados usando la infraestructura global de impresión
   * (`usePrint` + `GlobalPrinterPortal`). Solo se imprimen lotes Confirmados; los demás
   * se filtran antes. Si la lista queda vacía, no se genera nada.
   */
  const printReporte = useCallback(
    (lotes: LoteCierreResponse[]) => {
      const candidatos = lotes.filter((l) => l.estado_leyes === "Confirmado");
      if (candidatos.length === 0) return;

      prepare(TARGET_NAME);
      print(
        <ReporteCierreLeyesPdf lotes={candidatos} />,
        {
          documentTitle: "Reporte Cierre de Leyes",
          target: TARGET_NAME,
        },
      );
    },
    [print, prepare],
  );

  return { printReporte };
};
