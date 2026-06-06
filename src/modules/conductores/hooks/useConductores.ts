import { useState, useEffect, useMemo } from "react";
import { ConductoresService } from "../service/conductores.service";
import type { ConductorResponse } from "../service/conductores.responses";
import { useNotify } from "../../../hooks/useNotify";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export const useConductores = () => {
  const [conductores, setConductores] = useState<ConductorResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { notifyError, notifySuccess } = useNotify();

  const fetchConductores = async () => {
    setLoading(true);
    try {
      const data = await ConductoresService.getConductores();
      setConductores(data);
    } catch (e) {
      console.error(e);
      notifyError("Ocurrió un error al cargar los conductores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConductores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const conductoresFiltrados = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return conductores;
    return conductores.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.apellido.toLowerCase().includes(q) ||
        c.dni.includes(q) ||
        (c.ruc && c.ruc.includes(q)) ||
        c.numero_licencia.toLowerCase().includes(q)
    );
  }, [conductores, searchQuery]);

  const insertConductor = (c: ConductorResponse) => {
    setConductores((prev) => {
      const exists = prev.some((item) => item.id === c.id);
      if (exists) {
        return prev.map((item) => (item.id === c.id ? c : item));
      }
      return [c, ...prev];
    });
  };

  const updateConductor = (c: ConductorResponse) => {
    setConductores((prev) => prev.map((item) => (item.id === c.id ? c : item)));
  };

  const toggleEstado = async (id: number, currentEstado: EstadoBase) => {
    const nuevoEstado =
      currentEstado === EstadoBase.Activo ? EstadoBase.Inactivo : EstadoBase.Activo;
    try {
      const updated = await ConductoresService.cambiarEstadoConductor(id, nuevoEstado);
      updateConductor(updated);
      notifySuccess(`Conductor ${nuevoEstado.toLowerCase()} correctamente`);
    } catch (e) {
      console.error(e);
      notifyError("No se pudo cambiar el estado del conductor");
      throw e;
    }
  };

  return {
    conductores: conductoresFiltrados,
    loading,
    searchQuery,
    setSearchQuery,
    fetchConductores,
    insertConductor,
    updateConductor,
    toggleEstado,
  };
};
