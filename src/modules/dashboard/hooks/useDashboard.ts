import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardService } from "../service/dashboard.service";
import type { RES_Dashboard, RES_DashboardMes } from "../service/dashboard.responses";
import { AuxService } from "../../../service/auxiliar.service";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import { useUIStore } from "../../../stores/ui.store";
import { useNotify } from "../../../hooks/useNotify";
import { useAuthStore } from "../../../stores/auth.store";

/** Proveedor miners para el filtro de TN recepcionadas. */
export interface DashboardProveedor {
  id: number;
  razon_social: string;
}

/** Planta de destino para el filtro de TN despachadas. */
export interface DashboardPlanta {
  id: number;
  razon_social: string;
}

/**
 * La ventana de análisis son los últimos 12 meses **incluyendo el mes en
 * curso**; el filtro arranca en el mes actual y permite consultar hacia atrás.
 */
export const useDashboard = () => {
  const sucursal = useUIStore((state) => state.sucursal_elegida);
  const { notifyError } = useNotify();

  const [data, setData] = useState<RES_Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  /**
   * true cuando el servidor respondió 403: el usuario no tiene el permiso
   * `ver_dashboard`. Puede ocurrir con una sesión vieja (permisos guardados en
   * localStorage antes de existir la columna).
   */
  const [sinPermiso, setSinPermiso] = useState(false);
  /**
   * Índice del mes seleccionado dentro de la ventana (0 = el más antiguo).
   * `null` = sin selección explícita → se usa el último índice, que
   * corresponde al mes en curso.
   */
  const [mesIndex, setMesIndex] = useState<number | null>(null);

  /**
   * Filtros de la serie mensual. Son independientes: el proveedor acota las
   * TN recepcionadas y la planta acota las TN despachadas.
   */
  const [idProveedorMinero, setIdProveedorMinero] = useState<number | null>(
    null,
  );
  const [idPlantaDestino, setIdPlantaDestino] = useState<number | null>(null);

  /** Catálogos de los selectores de filtro. */
  const [proveedores, setProveedores] = useState<DashboardProveedor[]>([]);
  const [plantas, setPlantas] = useState<DashboardPlanta[]>([]);

  const idSucursal = sucursal?.id_sucursal ?? null;

  /**
   * Permiso `ver_dashboard`. Si está denegado no se piden los indicadores.
   */
  const permisos = useAuthStore((state) => state.usuario?.permisos);
  const puedeVerDashboard = (() => {
    const entrada = permisos?.find((p) => p.codigo === "ver_dashboard");
    return entrada ? entrada.decision : true;
  })();

  const load = useCallback(async () => {
    if (!puedeVerDashboard) return;

    setLoading(true);
    try {
      const res = await DashboardService.get_resumen({
        id_sucursal: idSucursal,
        id_proveedor_minero: idProveedorMinero,
        id_planta_destino: idPlantaDestino,
      });

      if (!res.success) {
        notifyError(res.message || "No se pudieron obtener los indicadores.");
        return;
      }

      setData(res.data);
    } catch (e) {
      // 403 = sin permiso `ver_dashboard`. No es un error de red: la vista cae
      // a la pantalla de Inicio sin avisar.
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        setSinPermiso(true);
        return;
      }

      console.error("Error al cargar indicadores del dashboard", e);
      notifyError("Ocurrió un error al cargar los indicadores del dashboard");
    } finally {
      setLoading(false);
    }
  }, [
    idSucursal,
    idProveedorMinero,
    idPlantaDestino,
    notifyError,
    puedeVerDashboard,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Catálogos de los selectores. Se cargan una sola vez: no dependen de los
   * filtros ni de la sucursal.
   */
  const cargarCatalogos = useCallback(async () => {
    try {
      const [resProveedores, resPlantas] = await Promise.all([
        AuxService.get_proveedores({ estado: EstadoBase.Activo }),
        AuxService.get_plantas_despachable(),
      ]);

      if (resProveedores.success && Array.isArray(resProveedores.data)) {
        setProveedores(
          resProveedores.data.map((p) => ({
            id: p.id_proveedor,
            razon_social: p.razon_social,
          })),
        );
      }

      if (Array.isArray(resPlantas)) {
        setPlantas(
          resPlantas.map((p) => ({
            id: p.id,
            razon_social: p.razon_social,
          })),
        );
      }
    } catch (e) {
      console.error("Error al cargar los catálogos de filtros del dashboard", e);
    }
  }, []);

  useEffect(() => {
    void cargarCatalogos();
  }, [cargarCatalogos]);

  const meses = useMemo(
    () => data?.periodo.meses ?? [],
    [data],
  );
  const mesesAnioAnterior = useMemo(
    () => data?.periodo.meses_anio_anterior ?? [],
    [data],
  );

  // Por defecto se muestra el ÚLTIMO mes de la ventana (el mes en curso);
  // el usuario puede consultar los meses anteriores desde el filtro.
  const indice =
    meses.length > 0
      ? Math.min(mesIndex ?? meses.length - 1, meses.length - 1)
      : 0;

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

  /** `YYYY-MM` del mes en curso (último de la ventana). */
  const mesActual = data?.periodo.mes_actual ?? null;

  return {
    data,
    loading,
    load,
    sinPermiso,
    meses,
    mesesAnioAnterior,
    indice,
    setMesIndex,
    mes,
    mesActual,
    mesAnterior,
    mismoMesAnioAnterior,
    idProveedorMinero,
    setIdProveedorMinero,
    idPlantaDestino,
    setIdPlantaDestino,
    proveedores,
    plantas,
  };
};
