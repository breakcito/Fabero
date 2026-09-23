import { useCallback, useState } from "react";
import { ProgramacionDespachosService } from "../../programacion-despachos/service/programacion-despachos.service";
import { useNotify } from "../../../hooks/useNotify";
import type {
  DistribucionDetalleItem,
  ItemDisponibleDespacho,
} from "../../programacion-despachos/service/programacion-despachos.responses";

export const useAsignarCarga = (idDistribucion: number) => {
  const { notifySuccess, notifyError } = useNotify();
  const [loading, setLoading] = useState(false);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [lotesDisponibles, setLotesDisponibles] = useState<ItemDisponibleDespacho[]>([]);

  const cargarLotes = useCallback(async () => {
    setLoadingLotes(true);
    try {
      const data = await ProgramacionDespachosService.getLotesDisponiblesParaDistribucion(idDistribucion);
      setLotesDisponibles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      notifyError("No se pudieron cargar los lotes disponibles.");
    } finally {
      setLoadingLotes(false);
    }
  }, [idDistribucion, notifyError]);

  const asignar = useCallback(
    async (idDespachoDetalle: number, pesoTomado: number): Promise<DistribucionDetalleItem | null> => {
      setLoading(true);
      try {
        const detalle = await ProgramacionDespachosService.agregarDetalleDistribucion(
          idDistribucion,
          { id_despacho_detalle: idDespachoDetalle, peso_tomado: pesoTomado },
        );
        notifySuccess("Carga asignada correctamente.");
        return detalle;
      } catch (e: unknown) {
        console.error(e);
        const axiosErr = e as { response?: { data?: { message?: string } } };
        notifyError(
          axiosErr?.response?.data?.message ??
            "No se pudo asignar la carga a la distribución.",
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [idDistribucion, notifyError, notifySuccess],
  );

  const reset = useCallback(() => {
    setLotesDisponibles([]);
  }, []);

  return {
    loading,
    loadingLotes,
    lotesDisponibles,
    cargarLotes,
    asignar,
    reset,
  };
};
