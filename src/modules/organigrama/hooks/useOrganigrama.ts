import { useState, useEffect, useCallback, useMemo } from "react";
import { OrganigramaService } from "../service/organigrama.service";
import type { RES_Area, RES_Cargo } from "../service/organigrama.responses";

export const useOrganigrama = () => {
  const [areas, setAreas] = useState<RES_Area[]>([]);
  const [cargos, setCargos] = useState<RES_Cargo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCargos, setLoadingCargos] = useState(false);

  const [busquedaAreas, setBusquedaAreas] = useState("");
  const [busquedaCargos, setBusquedaCargos] = useState("");

  const [areaSeleccionada, setAreaSeleccionada] = useState<RES_Area | null>(
    null,
  );

  const listarAreas = useCallback(async () => {
    try {
      const resp = await OrganigramaService.get_areas();
      if (resp.success) setAreas(resp.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const listarCargos = useCallback(async (id_area: number) => {
    setLoadingCargos(true);
    try {
      const resp = await OrganigramaService.get_cargos(id_area);
      if (resp.success) setCargos(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCargos(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await listarAreas();
      setLoading(false);
    };
    init();
  }, [listarAreas]);

  useEffect(() => {
    if (areaSeleccionada) {
      listarCargos(areaSeleccionada.id_area);
    } else {
      setCargos([]);
    }
  }, [areaSeleccionada, listarCargos]);

  const areasFiltradas = useMemo(() => {
    const q = busquedaAreas.toLowerCase();
    return areas.filter((a) => a.nombre.toLowerCase().includes(q));
  }, [areas, busquedaAreas]);

  const cargosFiltrados = useMemo(() => {
    const q = busquedaCargos.toLowerCase();
    return cargos.filter((c) => c.nombre.toLowerCase().includes(q));
  }, [cargos, busquedaCargos]);

  return {
    areas,
    cargos,
    loading,
    loadingCargos,
    busquedaAreas,
    setBusquedaAreas,
    busquedaCargos,
    setBusquedaCargos,
    areasFiltradas,
    cargosFiltrados,
    areaSeleccionada,
    setAreaSeleccionada,
    recargarAreas: listarAreas,
    recargarCargos: () =>
      areaSeleccionada && listarCargos(areaSeleccionada.id_area),
    onAreaCreada: (nueva: RES_Area) => setAreas((prev) => [nueva, ...prev]),
    onCargoCreado: (nuevo: RES_Cargo) => setCargos((prev) => [nuevo, ...prev]),
    handleCambiarEstadoCargo: async (id_cargo: number) => {
      try {
        const resp = await OrganigramaService.cambiar_estado_cargo(id_cargo);
        if (resp.success) {
          setCargos((prev) =>
            prev.map((c) =>
              c.id_cargo === id_cargo
                ? {
                    ...c,
                    estado: c.estado === "Activo" ? "Inactivo" : "Activo",
                  }
                : c,
            ),
          );
        }
      } catch (err) {
        console.error(err);
      }
    },
  };
};
