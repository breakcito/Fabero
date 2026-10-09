import { useCallback } from "react";
import { usePrint } from "../../../hooks/usePrint";
import { ReporteMuestrasExternasPdf } from "../presentation/components/reporte-muestras-externas-pdf";
import type { MuestraExternaResponse } from "../service/cierre-leyes.responses";
import type { GrupoAnalisisResponse } from "../../gestion-leyes/service/gestion-leyes.responses";

const TARGET_NAME = "reporte-muestras-externas";

export const useReporteMuestrasExternas = () => {
  const { print, prepare } = usePrint();

  const printReporteMuestras = useCallback(
    (muestras: MuestraExternaResponse[], grupos: GrupoAnalisisResponse[]) => {
      if (muestras.length === 0) return;

      prepare(TARGET_NAME);
      print(
        <ReporteMuestrasExternasPdf muestras={muestras} grupos={grupos} />,
        {
          documentTitle: "Reporte de Muestras Externas - Leyes",
          target: TARGET_NAME,
        },
      );
    },
    [print, prepare],
  );

  return { printReporteMuestras };
};
