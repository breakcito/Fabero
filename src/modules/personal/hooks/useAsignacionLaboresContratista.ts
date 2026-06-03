import { useState, useCallback } from "react";
import { useNotify } from "../../../hooks/useNotify";
import {
  ContratistasService,
  EmpleadosService,
} from "../service/empleados.service";
import type {
  RES_Contratista,
  RES_Labor,
  RES_Mina,
} from "../service/empleados.responses";

export const useAsignacionLaboresContratista = (
  onUpdateLocal: (editado: RES_Contratista) => void,
) => {
  const { notify } = useNotify();

  const [contratista, setContratista] = useState<RES_Contratista | null>(null);
  const [minas, setMinas] = useState<RES_Mina[]>([]);
  const [idMina, setIdMina] = useState<number | null>(null);
  const [laboresDisponibles, setLaboresDisponibles] = useState<RES_Labor[]>([]);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMinas, setLoadingMinas] = useState(false);
  const [loadingLabores, setLoadingLabores] = useState(false);

  const cargarMinas = useCallback(async () => {
    setLoadingMinas(true);
    try {
      const resp = await EmpleadosService.get_minas();
      if (resp.success) setMinas(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMinas(false);
    }
  }, []);

  const cargarCatalogoLabores = useCallback(
    async (minaId: number) => {
      setLoadingLabores(true);
      try {
        const resp = await ContratistasService.get_labores_disponibles(minaId);
        if (resp.success) {
          setLaboresDisponibles(resp.data);
        }
      } catch (err) {
        console.error(err);
        notify({
          type: "error",
          content: "Error al cargar catálogo de labores",
        });
      } finally {
        setLoadingLabores(false);
      }
    },
    [notify],
  );

  const abrir = useCallback(
    async (emp: RES_Contratista) => {
      setContratista(emp);
      setIdMina(emp.id_mina || null);
      cargarMinas();

      if (emp.ids_labor_asignadas) {
        const ids = emp.ids_labor_asignadas.split(",").map(Number);
        setSeleccionados(ids);
      } else {
        setSeleccionados([]);
      }

      if (emp.id_mina) {
        cargarCatalogoLabores(emp.id_mina);
      }
    },
    [cargarCatalogoLabores, cargarMinas],
  );

  const handleMinaChange = (val: number | null) => {
    setIdMina(val);
    setSeleccionados([]);
    setLaboresDisponibles([]);
    if (val) {
      cargarCatalogoLabores(val);
    }
  };

  const cerrar = () => {
    setContratista(null);
    setIdMina(null);
    setLaboresDisponibles([]);
    setSeleccionados([]);
  };

  const toggleSeleccion = (idLabor: number) => {
    setSeleccionados((prev) =>
      prev.includes(idLabor)
        ? prev.filter((id) => id !== idLabor)
        : [...prev, idLabor],
    );
  };

  const handleAsignar = async () => {
    if (!contratista) return;

    if (!idMina) {
      notify({ type: "info", content: "Debe seleccionar una mina" });
      return;
    }

    setLoading(true);
    try {
      const resp = await ContratistasService.asignar_labores(
        contratista.id_contratista,
        {
          id_mina: idMina,
          ids_labor: seleccionados,
        },
      );
      if (resp.success) {
        notify({ type: "success", content: resp.message });
        onUpdateLocal(resp.data);
        cerrar();
      } else {
        notify({ type: "error", content: resp.message });
      }
    } catch (err) {
      console.error(err);
      notify({ type: "error", content: "Error inesperado" });
    } finally {
      setLoading(false);
    }
  };

  return {
    contratista,
    minas,
    idMina,
    onMinaChange: handleMinaChange,
    laboresDisponibles,
    seleccionados,
    loading,
    loadingMinas,
    loadingLabores,
    opened: contratista !== null,
    abrir,
    cerrar,
    toggleSeleccion,
    handleAsignar,
  };
};
