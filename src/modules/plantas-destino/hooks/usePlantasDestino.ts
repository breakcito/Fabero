import { useState, useEffect, useMemo } from "react";
import { PlantasDestinoService } from "../service/plantas-destino.service";
import type { PlantaDestinoResponse } from "../service/plantas-destino.responses";
import { useNotify } from "../../../hooks/useNotify";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export const usePlantasDestino = () => {
  const [plantas, setPlantas] = useState<PlantaDestinoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { notifyError, notifySuccess } = useNotify();

  const fetchPlantas = async () => {
    setLoading(true);
    try {
      const data = await PlantasDestinoService.getPlantas();
      setPlantas(data);
    } catch (e) {
      console.error(e);
      notifyError("Ocurrió un error al cargar las plantas de destino");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlantas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plantasFiltradas = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return plantas;
    return plantas.filter(
      (p) =>
        p.razon_social.toLowerCase().includes(q) ||
        p.ruc.toLowerCase().includes(q)
    );
  }, [plantas, searchQuery]);

  const insertPlanta = (p: PlantaDestinoResponse) => {
    setPlantas((prev) => {
      const exists = prev.some((item) => item.id === p.id);
      if (exists) {
        return prev.map((item) => (item.id === p.id ? p : item));
      }
      return [p, ...prev];
    });
  };

  const updatePlanta = (p: PlantaDestinoResponse) => {
    setPlantas((prev) => prev.map((item) => (item.id === p.id ? p : item)));
  };

  const toggleEstado = async (id: number, currentEstado: EstadoBase) => {
    const nuevoEstado =
      currentEstado === EstadoBase.Activo ? EstadoBase.Inactivo : EstadoBase.Activo;
    try {
      const updated = await PlantasDestinoService.cambiarEstadoPlanta(id, nuevoEstado);
      updatePlanta(updated);
      notifySuccess(`Planta de destino ${nuevoEstado.toLowerCase()} correctamente`);
    } catch (e) {
      console.error(e);
      notifyError("No se pudo cambiar el estado de la planta de destino");
      throw e;
    }
  };

  const actualizarCantidadCuentasPlanta = (idPlanta: number, count: number) => {
    setPlantas((prev) =>
      prev.map((p) => (p.id === idPlanta ? { ...p, cantidad_cuentas: count } : p))
    );
  };

  const actualizarCantidadProveedoresPlanta = (idPlanta: number, count: number) => {
    setPlantas((prev) =>
      prev.map((p) => (p.id === idPlanta ? { ...p, cantidad_proveedores: count } : p))
    );
  };

  return {
    plantas: plantasFiltradas,
    loading,
    searchQuery,
    setSearchQuery,
    fetchPlantas,
    insertPlanta,
    updatePlanta,
    toggleEstado,
    actualizarCantidadCuentasPlanta,
    actualizarCantidadProveedoresPlanta,
  };
};
