import { useState, useCallback, useEffect } from "react";
import { BlendingService } from "../service/blending.service";
import type { ItemDisponibleResponse } from "../service/blending.responses";
import { AuxService } from "../../../service/auxiliar.service";
import type { RES_Proveedor } from "../../../service/responses/proveedor";
import { useNotify } from "../../../hooks/useNotify";

export const useBlendingDisponibles = () => {
  const [disponibles, setDisponibles] = useState<ItemDisponibleResponse[]>([]);
  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [idProveedorSeleccionado, setIdProveedorSeleccionado] = useState<number | null>(null);
  const [loadingDisponibles, setLoadingDisponibles] = useState<boolean>(false);
  const [loadingProveedores, setLoadingProveedores] = useState<boolean>(false);
  const { notifyError } = useNotify();

  const fetchProveedores = useCallback(async () => {
    setLoadingProveedores(true);
    try {
      const res = await AuxService.get_proveedores();
      setProveedores(res.data || []);
    } catch {
      // Ignorar errores menores de catálogo
    } finally {
      setLoadingProveedores(false);
    }
  }, []);

  const fetchDisponibles = useCallback(async () => {
    setLoadingDisponibles(true);
    try {
      const data = await BlendingService.get_disponibles(
        idProveedorSeleccionado ?? undefined
      );
      setDisponibles(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar los lotes disponibles.";
      notifyError(message);
    } finally {
      setLoadingDisponibles(false);
    }
  }, [idProveedorSeleccionado, notifyError]);

  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

  const limpiarDisponibles = useCallback(() => {
    setDisponibles([]);
  }, []);

  return {
    disponibles,
    proveedores,
    idProveedorSeleccionado,
    setIdProveedorSeleccionado,
    loadingDisponibles,
    loadingProveedores,
    refetchDisponibles: fetchDisponibles,
    limpiarDisponibles,
  };
};
