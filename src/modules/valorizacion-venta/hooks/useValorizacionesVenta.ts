import { useState, useEffect, useCallback } from "react";
import { ValorizacionVentaService } from "../service/valorizacion-venta.service";
import { useNotify } from "../../../hooks/useNotify";
import type { RES_ValorizacionVenta } from "../service/valorizacion-venta.responses";
import type { REQ_AnularValorizacionVenta } from "../service/valorizacion-venta.requests";

export const useValorizacionesVenta = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [idPlantaFiltro, setIdPlantaFiltro] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [valorizaciones, setValorizaciones] = useState<RES_ValorizacionVenta[]>([]);

  const [modalFormOpened, setModalFormOpened] = useState(false);
  const [valorizacionEditar, setValorizacionEditar] =
    useState<RES_ValorizacionVenta | null>(null);

  const [modalAnularOpened, setModalAnularOpened] = useState(false);
  const [valorizacionAnular, setValorizacionAnular] =
    useState<RES_ValorizacionVenta | null>(null);

  const [togglingIds, setTogglingIds] = useState<Record<number, boolean>>({});

  const cargarValorizaciones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ValorizacionVentaService.listarValorizaciones({
        id_planta: idPlantaFiltro ?? undefined,
      });
      if (res.success) {
        setValorizaciones(res.data);
      }
    } catch (err) {
      notifyError(
        err instanceof Error ? err.message : "Error al cargar valorizaciones",
      );
    } finally {
      setLoading(false);
    }
  }, [idPlantaFiltro, notifyError]);

  useEffect(() => {
    cargarValorizaciones();
  }, [cargarValorizaciones]);

  const handleNuevo = () => {
    setValorizacionEditar(null);
    setModalFormOpened(true);
  };

  const handleEditar = (item: RES_ValorizacionVenta) => {
    setValorizacionEditar(item);
    setModalFormOpened(true);
  };

  const handleAprobar = async (id: number) => {
    setTogglingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await ValorizacionVentaService.aprobarValorizacion(id);
      if (res.success) {
        notifySuccess("Valorización aprobada correctamente");
        await cargarValorizaciones();
      } else {
        notifyError(res.message || "Error al aprobar la valorización");
      }
    } catch (err: unknown) {
      let rawMsg = "Error al aprobar la valorización";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) {
          rawMsg = axiosErr.response.data.message;
        }
      } else if (err instanceof Error) {
        rawMsg = err.message;
      }
      const cleanMsg = rawMsg.replace(/^Error al aprobar valorización:\s*/i, "");
      notifyError(cleanMsg);
    } finally {
      setTogglingIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleAbrirAnular = (item: RES_ValorizacionVenta) => {
    setValorizacionAnular(item);
    setModalAnularOpened(true);
  };

  const handleConfirmarAnular = async (payload: REQ_AnularValorizacionVenta) => {
    if (!valorizacionAnular) return;
    const id = valorizacionAnular.id;
    setTogglingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await ValorizacionVentaService.anularValorizacion(id, payload);
      if (res.success) {
        notifySuccess(
          payload.tipo_eliminacion === "fisica"
            ? "Valorización eliminada físicamente correctamente"
            : "Valorización anulada correctamente",
        );
        setModalAnularOpened(false);
        setValorizacionAnular(null);
        await cargarValorizaciones();
      } else {
        notifyError(res.message || "Error al procesar la anulación");
      }
    } catch (err) {
      notifyError(
        err instanceof Error ? err.message : "Error al procesar la anulación",
      );
    } finally {
      setTogglingIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  return {
    idPlantaFiltro,
    setIdPlantaFiltro,
    loading,
    valorizaciones,
    modalFormOpened,
    setModalFormOpened,
    valorizacionEditar,
    modalAnularOpened,
    setModalAnularOpened,
    valorizacionAnular,
    togglingIds,
    cargarValorizaciones,
    handleNuevo,
    handleEditar,
    handleAprobar,
    handleAbrirAnular,
    handleConfirmarAnular,
  };
};
