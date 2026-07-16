import { useState, useEffect, useMemo } from "react";
import { ProveedoresService } from "../service/proveedores.service";
import type { ProveedorResponse } from "../service/proveedores.responses";
import { useNotify } from "../../../hooks/useNotify";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export const useProveedores = () => {
  const [proveedores, setProveedores] = useState<ProveedorResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const { notifyError, notifySuccess } = useNotify();

  const fetchProveedores = async () => {
    setLoading(true);
    try {
      const data = await ProveedoresService.getProveedores();
      setProveedores(data);
    } catch (e) {
      console.error(e);
      notifyError("Ocurrió un error al cargar los proveedores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const proveedoresFiltrados = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return proveedores;
    return proveedores.filter(
      (p) =>
        p.razon_social.toLowerCase().includes(q) ||
        (p.ruc && p.ruc.toLowerCase().includes(q)) ||
        (p.dni && p.dni.toLowerCase().includes(q))
    );
  }, [proveedores, searchQuery]);

  const insertProveedor = (p: ProveedorResponse) => {
    setProveedores((prev) => {
      const exists = prev.some((item) => item.id_proveedor === p.id_proveedor);
      if (exists) {
        return prev.map((item) => (item.id_proveedor === p.id_proveedor ? p : item));
      }
      return [p, ...prev];
    });
  };

  const updateProveedor = (p: ProveedorResponse) => {
    setProveedores((prev) =>
      prev.map((item) => (item.id_proveedor === p.id_proveedor ? p : item))
    );
  };

  const deleteProveedor = async (id: number) => {
    try {
      await ProveedoresService.eliminarProveedor(id);
      setProveedores((prev) => prev.filter((item) => item.id_proveedor !== id));
    } catch (e) {
      console.error(e);
      notifyError("No se pudo eliminar el proveedor");
      throw e;
    }
  };

  const toggleEstado = async (id: number, currentEstado: EstadoBase) => {
    const nuevoEstado = currentEstado === EstadoBase.Activo ? EstadoBase.Inactivo : EstadoBase.Activo;
    setTogglingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const updated = await ProveedoresService.cambiarEstadoProveedor(id, nuevoEstado);
      updateProveedor(updated);
      notifySuccess(`Proveedor ${nuevoEstado.toLowerCase()} correctamente`);
    } catch (e) {
      console.error(e);
      notifyError("No se pudo cambiar el estado del proveedor");
      throw e;
    } finally {
      setTogglingIds((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const actualizarCantidadCuentasProveedor = (idProveedor: number, count: number) => {
    setProveedores((prev) =>
      prev.map((p) =>
        p.id_proveedor === idProveedor
          ? { ...p, cantidad_cuentas_bancarias: count }
          : p
      )
    );
  };

  return {
    proveedores: proveedoresFiltrados,
    loading,
    togglingIds,
    searchQuery,
    setSearchQuery,
    fetchProveedores,
    insertProveedor,
    updateProveedor,
    deleteProveedor,
    toggleEstado,
    actualizarCantidadCuentasProveedor,
  };
};
