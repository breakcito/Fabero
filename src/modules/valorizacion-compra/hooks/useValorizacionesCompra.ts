import { useState, useEffect, useCallback } from "react";
import { ValorizacionCompraService } from "../service/valorizacion-compra.service";
import { useNotify } from "../../../hooks/useNotify";
import type { RES_ValorizacionCompra } from "../service/valorizacion-compra.responses";
import type {
  REQ_AnularValorizacion,
  REQ_AprobarValorizacion,
} from "../service/valorizacion-compra.requests";

const extraerMensajeError = (err: unknown, fallback: string): string => {
  if (err && typeof err === "object" && "response" in err) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message;
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
};

export const useValorizacionesCompra = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [idProveedorFiltro, setIdProveedorFiltro] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [valorizaciones, setValorizaciones] = useState<RES_ValorizacionCompra[]>([]);

  const [modalFormOpened, setModalFormOpened] = useState(false);
  const [valorizacionEditar, setValorizacionEditar] =
    useState<RES_ValorizacionCompra | null>(null);

  const [modalAnularOpened, setModalAnularOpened] = useState(false);
  const [valorizacionAnular, setValorizacionAnular] =
    useState<RES_ValorizacionCompra | null>(null);

  const [togglingIds, setTogglingIds] = useState<Record<number, boolean>>({});
  const [clonandoIds, setClonandoIds] = useState<Record<number, boolean>>({});

  const cargarValorizaciones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ValorizacionCompraService.listarValorizaciones({
        id_proveedor: idProveedorFiltro ?? undefined,
      });
      if (res.success) {
        setValorizaciones(res.data);
      }
    } catch (err) {
      notifyError(extraerMensajeError(err, "Error al cargar valorizaciones"));
    } finally {
      setLoading(false);
    }
  }, [idProveedorFiltro, notifyError]);

  useEffect(() => {
    void cargarValorizaciones();
  }, [cargarValorizaciones]);

  const handleNuevo = () => {
    setValorizacionEditar(null);
    setModalFormOpened(true);
  };

  const handleEditar = (item: RES_ValorizacionCompra) => {
    setValorizacionEditar(item);
    setModalFormOpened(true);
  };

  const handleClonar = async (
    item: RES_ValorizacionCompra,
  ): Promise<RES_ValorizacionCompra | null> => {
    const id = item.id;
    setClonandoIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await ValorizacionCompraService.clonarValorizacion(id);
      if (res.success && res.data) {
        notifySuccess(res.message || "Nueva versión clonada correctamente");
        await cargarValorizaciones();
        return res.data;
      }
      notifyError(res.message || "No se pudo clonar la propuesta");
      return null;
    } catch (err: unknown) {
      notifyError(extraerMensajeError(err, "Error al clonar la propuesta"));
      return null;
    } finally {
      setClonandoIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleAprobar = async (
    id: number,
    payload: REQ_AprobarValorizacion,
  ): Promise<boolean> => {
    setTogglingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await ValorizacionCompraService.aprobarValorizacion(id, payload);
      if (res.success) {
        notifySuccess("Propuesta aprobada correctamente");
        await cargarValorizaciones();
        return true;
      }
      notifyError(res.message || "Error al aprobar la valorización");
      return false;
    } catch (err: unknown) {
      const rawMsg = extraerMensajeError(err, "Error al aprobar la valorización");
      const cleanMsg = rawMsg.replace(/^Error al aprobar valorización:\s*/i, "");
      notifyError(cleanMsg);
      return false;
    } finally {
      setTogglingIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleAbrirAnular = (item: RES_ValorizacionCompra) => {
    setValorizacionAnular(item);
    setModalAnularOpened(true);
  };

  const handleConfirmarAnular = async (payload: REQ_AnularValorizacion) => {
    if (!valorizacionAnular) return;
    const id = valorizacionAnular.id;
    setTogglingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await ValorizacionCompraService.anularValorizacion(id, payload);
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
      notifyError(extraerMensajeError(err, "Error al procesar la anulación"));
    } finally {
      setTogglingIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  return {
    idProveedorFiltro,
    setIdProveedorFiltro,
    loading,
    valorizaciones,
    modalFormOpened,
    setModalFormOpened,
    valorizacionEditar,
    modalAnularOpened,
    setModalAnularOpened,
    valorizacionAnular,
    togglingIds,
    clonandoIds,
    cargarValorizaciones,
    handleNuevo,
    handleEditar,
    handleClonar,
    handleAprobar,
    handleAbrirAnular,
    handleConfirmarAnular,
  };
};
