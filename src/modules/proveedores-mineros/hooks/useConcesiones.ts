import { useState, useEffect, useCallback, useMemo } from "react";
import { useNotify } from "../../../hooks/useNotify";
import { ConcesionesService } from "../service/concesiones.service";
import type { RES_Concesion } from "../service/concesiones.responses";

export const useConcesiones = () => {
  const { notify } = useNotify();
  const [concesiones, setConcesiones] = useState<RES_Concesion[]>([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const listar = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await ConcesionesService.get_concesiones();
      if (resp.success) {
        setConcesiones(resp.data);
      } else {
        notify({ type: "error", content: resp.message });
      }
    } catch (err) {
      notify({ type: "error", content: "Error al cargar las concesiones" });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    listar();
  }, [listar]);

  const filtradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    return concesiones.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.codigo_concesion.toLowerCase().includes(q),
    );
  }, [concesiones, busqueda]);

  const pushNuevaConcesion = (nueva: RES_Concesion) => {
    setConcesiones((prev) => [nueva, ...prev]);
  };

  const actualizarContratosActivos = (id_concesion: number, delta: number) => {
    setConcesiones((prev) =>
      prev.map((c) =>
        c.id_concesion === id_concesion
          ? {
              ...c,
              contratos_activos: Math.max(0, c.contratos_activos + delta),
            }
          : c,
      ),
    );
  };

  return {
    concesiones: filtradas,
    loading,
    busqueda,
    setBusqueda,
    recargar: listar,
    pushNuevaConcesion,
    actualizarContratosActivos,
  };
};
