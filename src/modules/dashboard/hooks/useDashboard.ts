import { useCallback, useEffect, useState } from "react";
import { DashboardService } from "../service/dashboard.service";
import type { RES_Dashboard } from "../service/dashboard.responses";
import { useUIStore } from "../../../stores/ui.store";
import { useNotify } from "../../../hooks/useNotify";
import {
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";
import type { MonedaDashboard } from "../presentation/utils/moneda";

export const useDashboard = () => {
  const sucursal = useUIStore((state) => state.sucursal_elegida);
  const { notifyError } = useNotify();

  // Filtros
  const [fechaInicio, setFechaInicio] = useState<string>(defaultFechaInicio(29));
  const [fechaFin, setFechaFin] = useState<string>(defaultFechaFin());
  const [moneda, setMoneda] = useState<MonedaDashboard>("USD");

  // Datos
  const [data, setData] = useState<RES_Dashboard | null>(null);
  const [loading, setLoading] = useState(false);

  const idSucursal = sucursal?.id_sucursal ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await DashboardService.get_indicadores({
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
        id_sucursal: idSucursal,
      });

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
  }, [idSucursal, fechaInicio, fechaFin, notifyError]);

  useEffect(() => {
    load();
  }, [load]);

  const resetFiltros = () => {
    setFechaInicio(defaultFechaInicio(29));
    setFechaFin(defaultFechaFin());
  };

  return {
    data,
    loading,
    load,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    moneda,
    setMoneda,
    idSucursal,
    resetFiltros,
  };
};
