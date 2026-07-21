import { useState, useCallback, useEffect } from "react";
import { AuxService } from "../../../service/auxiliar.service";
import { CondicionesComercialesProveedorService } from "../service/condiciones-comerciales-proveedor.service";
import type { RES_Proveedor } from "../../../service/responses/proveedor";
import type { RES_CondicionComercialProveedor } from "../service/condiciones-comerciales-proveedor.responses";
import type { DTO_CrearCondicionComercial, DTO_ActualizarCondicionComercial } from "../service/condiciones-comerciales-proveedor.requests";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import { useNotify } from "../../../hooks/useNotify";

export const useCondicionesComercialesProveedor = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [idProveedorSeleccionado, setIdProveedorSeleccionado] = useState<number | null>(null);
  const [condiciones, setCondiciones] = useState<RES_CondicionComercialProveedor[]>([]);

  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [loadingCondiciones, setLoadingCondiciones] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Record<number, boolean>>({});

  const cargarProveedores = useCallback(async () => {
    setLoadingProveedores(true);
    try {
      const res = await AuxService.get_proveedores({ estado: EstadoBase.Activo });
      if (res.success && res.data) {
        setProveedores(res.data);
        if (res.data.length > 0 && idProveedorSeleccionado === null) {
          setIdProveedorSeleccionado(res.data[0].id_proveedor);
        }
      }
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al cargar la lista de proveedores");
    } finally {
      setLoadingProveedores(false);
    }
  }, [idProveedorSeleccionado, notifyError]);

  const cargarCondiciones = useCallback(async (idProveedor: number) => {
    setLoadingCondiciones(true);
    try {
      const res = await CondicionesComercialesProveedorService.get_condiciones(idProveedor);
      if (res.success && res.data) {
        setCondiciones(res.data);
      }
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al cargar las condiciones comerciales");
    } finally {
      setLoadingCondiciones(false);
    }
  }, [notifyError]);

  useEffect(() => {
    void cargarProveedores();
  }, [cargarProveedores]);

  useEffect(() => {
    if (idProveedorSeleccionado !== null) {
      void cargarCondiciones(idProveedorSeleccionado);
    } else {
      setCondiciones([]);
    }
  }, [idProveedorSeleccionado, cargarCondiciones]);

  const crearCondicion = async (payload: DTO_CrearCondicionComercial): Promise<boolean> => {
    setGuardando(true);
    try {
      const res = await CondicionesComercialesProveedorService.crear_condicion(payload);
      if (res.success && res.data) {
        notifySuccess(res.message || "Condición comercial registrada correctamente");
        if (idProveedorSeleccionado !== null) {
          void cargarCondiciones(idProveedorSeleccionado);
        }
        return true;
      }
      notifyError(res.message || "Error al registrar la condición comercial");
      return false;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al registrar la condición comercial");
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const actualizarCondicion = async (id: number, payload: DTO_ActualizarCondicionComercial): Promise<boolean> => {
    setGuardando(true);
    try {
      const res = await CondicionesComercialesProveedorService.actualizar_condicion(id, payload);
      if (res.success && res.data) {
        notifySuccess(res.message || "Condición comercial actualizada correctamente");
        if (idProveedorSeleccionado !== null) {
          void cargarCondiciones(idProveedorSeleccionado);
        }
        return true;
      }
      notifyError(res.message || "Error al actualizar la condición comercial");
      return false;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al actualizar la condición comercial");
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (id: number, estadoActual: EstadoBase): Promise<boolean> => {
    const nuevoEstado = estadoActual === EstadoBase.Activo ? EstadoBase.Inactivo : EstadoBase.Activo;
    setTogglingIds((prev) => ({ ...prev, [id]: true }));

    // Mutación optimista local
    setCondiciones((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estado: nuevoEstado } : c)),
    );

    try {
      const res = await CondicionesComercialesProveedorService.cambiar_estado(id, nuevoEstado);
      if (res.success) {
        notifySuccess(`Estado cambiado a ${nuevoEstado} correctamente`);
        return true;
      }
      notifyError(res.message || "Error al cambiar el estado");
      // Revertir
      setCondiciones((prev) =>
        prev.map((c) => (c.id === id ? { ...c, estado: estadoActual } : c)),
      );
      return false;
    } catch (err: unknown) {
      console.error(err);
      notifyError("Error al cambiar el estado");
      // Revertir
      setCondiciones((prev) =>
        prev.map((c) => (c.id === id ? { ...c, estado: estadoActual } : c)),
      );
      return false;
    } finally {
      setTogglingIds((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  return {
    proveedores,
    idProveedorSeleccionado,
    setIdProveedorSeleccionado,
    condiciones,
    loadingProveedores,
    loadingCondiciones,
    guardando,
    togglingIds,
    cargarCondiciones,
    crearCondicion,
    actualizarCondicion,
    cambiarEstado,
  };
};
