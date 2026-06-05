import { useState, useEffect, useMemo, useCallback } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useNotify } from "../../../hooks/useNotify";
import { SucursalesService } from "../service/sucursales.service";
import type { RES_Sucursal } from "../service/sucursales.responses";

export const useSucursales = () => {
  const { notify } = useNotify();

  // Estados de la lista
  const [sucursales, setSucursales] = useState<RES_Sucursal[]>([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // Modales
  const [openedCreate, { open: openCreate, close: closeCreate }] =
    useDisclosure(false);

  // Listar sucursales
  const listar = useCallback(async () => {
    setLoading(true);
    try {
      const result = await SucursalesService.get_sucursales();
      if (result.success) {
        setSucursales(result.data);
      } else {
        notify({ type: "error", content: result.message });
      }
    } catch (error) {
      notify({ type: "error", content: "Error al cargar las sucursales" });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    listar();
  }, [listar]);

  // Búsqueda y filtrado reactivo
  const sucursalesFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return sucursales.filter((sucursal) => {
      if (!q) return true;
      return (
        sucursal.nombre.toLowerCase().includes(q) ||
        (sucursal.departamento && sucursal.departamento.toLowerCase().includes(q)) ||
        (sucursal.provincia && sucursal.provincia.toLowerCase().includes(q)) ||
        (sucursal.distrito && sucursal.distrito.toLowerCase().includes(q)) ||
        (sucursal.direccion && sucursal.direccion.toLowerCase().includes(q)) ||
        (sucursal.telefono && sucursal.telefono.includes(q))
      );
    });
  }, [sucursales, busqueda]);

  const onSucursalCreada = (nueva: RES_Sucursal) => {
    setSucursales((prev) => [nueva, ...prev]);
  };

  return {
    sucursales,
    loading,
    busqueda,
    setBusqueda,
    sucursalesFiltradas,

    // Modales
    openedCreate,
    openCreate,
    closeCreate,

    // Handlers
    onSucursalCreada,
    recargar: listar,
  };
};
