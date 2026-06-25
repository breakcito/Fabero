import { useState, useEffect, useMemo } from "react";
import { ConductoresService } from "../service/conductores.service";
import type { RES_Conductor } from "../service/conductores.responses";
import { useNotify } from "../../../hooks/useNotify";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export const useConductores = () => {
  const [conductores, setConductores] = useState<RES_Conductor[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Record<number, boolean>>({});
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
        c.numero_licencia.toLowerCase().includes(q),
    );
  }, [conductores, searchQuery]);

  const insertConductor = (c: RES_Conductor) => {
    setConductores((prev) => {
      const exists = prev.some((item) => item.id_conductor === c.id_conductor);
      if (exists) {
        return prev.map((item) =>
          item.id_conductor === c.id_conductor ? c : item,
        );
      }
      return [c, ...prev];
    });
  };

  const updateConductor = (c: RES_Conductor) => {
    setConductores((prev) =>
      prev.map((item) => (item.id_conductor === c.id_conductor ? c : item)),
    );
  };

  const toggleEstado = async (id: number, currentEstado: EstadoBase) => {
    const nuevoEstado =
      currentEstado === EstadoBase.Activo
        ? EstadoBase.Inactivo
        : EstadoBase.Activo;
    setTogglingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const success = await ConductoresService.cambiarEstadoConductor(
        id,
        nuevoEstado,
      );
      if (success) {
        setConductores((prev) =>
          prev.map((item) =>
            item.id_conductor === id ? { ...item, estado: nuevoEstado } : item,
          ),
        );
        notifySuccess(`Conductor ${nuevoEstado.toLowerCase()} correctamente`);
      }
    } catch (e) {
      console.error(e);
      notifyError("No se pudo cambiar el estado del conductor");
      throw e;
    } finally {
      setTogglingIds((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  return {
    conductores: conductoresFiltrados,
    loading,
    togglingIds,
    searchQuery,
    setSearchQuery,
    fetchConductores,
    insertConductor,
    updateConductor,
    toggleEstado,
  };
};
