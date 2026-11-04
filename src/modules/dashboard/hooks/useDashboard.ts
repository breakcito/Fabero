import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardService } from "../service/dashboard.service";
import type { RES_Dashboard, RES_DashboardMes } from "../service/dashboard.responses";
import { useUIStore } from "../../../stores/ui.store";
import { useNotify } from "../../../hooks/useNotify";

/** Cantidad de meses de la ventana de análisis (12 meses cerrados). */
const MESES_VENTANA = 12;

export const useDashboard = () => {
  const sucursal = useUIStore((state) => state.sucursal_elegida);
  const { notifyError } = useNotify();

  const [data, setData] = useState<RES_Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  /** Índice del mes seleccionado dentro de la ventana (0 = el más antiguo). */
  const [mesIndex, setMesIndex] = useState(MESES_VENTANA - 1);

  const idSucursal = sucursal?.id_sucursal ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await DashboardService.get_resumen({ id_sucursal: idSucursal });

      if (!res.success) {
        notifyError(res.message || "No se pudieron obtener los indicadores.");
        return;
      }

      setData(res.data);
    } catch (e) {
      console.error("Error al cargar indicadores del dashboard", e);
      notifyError("Ocurrió un error al cargar los indicadores del dashboard");
    } finally {
      setLoading(false);
    }
  }, [idSucursal, notifyError]);

  useEffect(() => {
    load();
  }, [load]);

  const meses = useMemo(
    () => data?.periodo.meses ?? [],
    [data],
  );
  const mesesAnioAnterior = useMemo(
    () => data?.periodo.meses_anio_anterior ?? [],
    [data],
  );

  const indice = meses.length > 0 ? Math.min(mesIndex, meses.length - 1) : 0;

  /** Mes seleccionado dentro de la ventana actual. */
  const mes = meses[indice] ?? null;
  /**
   * Mes inmediatamente anterior al seleccionado. Cuando el seleccionado es el
   * primero de la ventana, el anterior cae en el último mes del año previo.
   */
  const mesAnterior: RES_DashboardMes | null =
    indice > 0
      ? (meses[indice - 1] ?? null)
      : (mesesAnioAnterior[mesesAnioAnterior.length - 1] ?? null);
  /** Mismo mes del año anterior (comparativo interanual). */
  const mismoMesAnioAnterior = mesesAnioAnterior[indice] ?? null;

  return {
    data,
    loading,
    load,
    meses,
    mesesAnioAnterior,
    indice,
    setMesIndex,
    mes,
    mesAnterior,
    mismoMesAnioAnterior,
  };
};
