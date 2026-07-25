import { useState, useEffect, useCallback } from "react";
import { ValorizacionCompraService } from "../service/valorizacion-compra.service";
import { useNotify } from "../../../hooks/useNotify";
import type { RES_ValorizacionCompra } from "../service/valorizacion-compra.responses";

export const useValorizacionesCompra = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [idProveedorFiltro, setIdProveedorFiltro] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [valorizaciones, setValorizaciones] = useState<RES_ValorizacionCompra[]>([]);

  const [modalFormOpened, setModalFormOpened] = useState(false);
  const [valorizacionEditar, setValorizacionEditar] =
    useState<RES_ValorizacionCompra | null>(null);

  const [togglingIds, setTogglingIds] = useState<Record<number, boolean>>({});

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
      notifyError(
        err instanceof Error ? err.message : "Error al cargar valorizaciones",
      );
    } finally {
      setLoading(false);
    }
  }, [idProveedorFiltro, notifyError]);

  useEffect(() => {
    cargarValorizaciones();
  }, [cargarValorizaciones]);

  const handleNuevo = () => {
    setValorizacionEditar(null);
    setModalFormOpened(true);
  };

  const handleEditar = (item: RES_ValorizacionCompra) => {
    setValorizacionEditar(item);
    setModalFormOpened(true);
  };

  const handleAprobar = async (id: number) => {
    setTogglingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await ValorizacionCompraService.aprobarValorizacion(id);
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

  const handleAnular = async (id: number) => {
    setTogglingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await ValorizacionCompraService.anularValorizacion(id);
      if (res.success) {
        notifySuccess("Valorización anulada correctamente");
        await cargarValorizaciones();
      }
    } catch (err) {
      notifyError(
        err instanceof Error ? err.message : "Error al anular la valorización",
      );
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
    togglingIds,
    cargarValorizaciones,
    handleNuevo,
    handleEditar,
    handleAprobar,
    handleAnular,
  };
};
