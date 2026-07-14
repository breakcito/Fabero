import { useState, useCallback, useEffect, useMemo } from "react";
import { GestionLeyesService } from "../service/gestion-leyes.service";
import type { GrupoAnalisisResponse, AnalitoResponse } from "../service/gestion-leyes.responses";
import type { CrearGrupoPayload } from "../service/gestion-leyes.requests";
import { useNotify } from "../../../hooks/useNotify";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export const useGestionLeyes = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [grupos, setGrupos] = useState<GrupoAnalisisResponse[]>([]);
  const [analitos, setAnalitos] = useState<AnalitoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const cargarGrupos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await GestionLeyesService.getGrupos();
      setGrupos(data);
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al cargar los grupos de análisis");
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  const cargarAnalitos = useCallback(async () => {
    try {
      const data = await GestionLeyesService.getAnalitos();
      setAnalitos(data);
    } catch (err: unknown) {
      console.error(err);
      notifyError("Ocurrió un error al cargar los analitos");
    }
  }, [notifyError]);

  useEffect(() => {
    cargarGrupos();
    cargarAnalitos();
  }, [cargarGrupos, cargarAnalitos]);

  const gruposFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return grupos;
    return grupos.filter((g) => g.nombre.toLowerCase().includes(q));
  }, [grupos, busqueda]);

  const analitosActivos = useMemo(() => {
    return analitos.filter((a) => a.estado === EstadoBase.Activo);
  }, [analitos]);

  const guardarGrupo = async (
    id: number | null,
    payload: CrearGrupoPayload
  ): Promise<boolean> => {
    try {
      if (id === null) {
        const nuevo = await GestionLeyesService.crearGrupo(payload);
        setGrupos((prev) => [nuevo, ...prev]);
        notifySuccess("Grupo de análisis creado correctamente");
      } else {
        const editado = await GestionLeyesService.editarGrupo(id, payload);
        setGrupos((prev) =>
          prev.map((g) => (g.id === id ? editado : g))
        );
        notifySuccess("Grupo de análisis editado correctamente");
      }
      return true;
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || "Ocurrió un error al guardar el grupo";
      notifyError(msg);
      return false;
    }
  };

  const toggleEstadoGrupo = async (id: number, estadoActual: string): Promise<boolean> => {
    const nuevoEstado =
      estadoActual === EstadoBase.Activo
        ? EstadoBase.Inactivo
        : EstadoBase.Activo;
    try {
      const editado = await GestionLeyesService.cambiarEstadoGrupo(id, nuevoEstado);
      setGrupos((prev) =>
        prev.map((g) => (g.id === id ? editado : g))
      );
      notifySuccess(`Estado del grupo cambiado a ${nuevoEstado} correctamente`);
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("No se pudo cambiar el estado del grupo de análisis");
      return false;
    }
  };

  const guardarAnalito = async (
    nombre: string,
    esDesplegable: boolean
  ): Promise<boolean> => {
    try {
      const nuevo = await GestionLeyesService.crearAnalito(nombre, esDesplegable);
      setAnalitos((prev) => [...prev, nuevo]);
      notifySuccess("Analito creado correctamente");
      return true;
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || "Ocurrió un error al guardar el analito";
      notifyError(msg);
      return false;
    }
  };

  const toggleEstadoAnalito = async (id: number, estadoActual: string): Promise<boolean> => {
    const nuevoEstado =
      estadoActual === EstadoBase.Activo
        ? EstadoBase.Inactivo
        : EstadoBase.Activo;
    try {
      const editado = await GestionLeyesService.cambiarEstadoAnalito(id, nuevoEstado);
      setAnalitos((prev) =>
        prev.map((a) => (a.id === id ? editado : a))
      );
      notifySuccess(`Estado del analito cambiado a ${nuevoEstado} correctamente`);
      return true;
    } catch (err: unknown) {
      console.error(err);
      notifyError("No se pudo cambiar el estado del analito");
      return false;
    }
  };

  const editarAnalito = async (
    id: number,
    nombre: string,
    esDesplegable: boolean
  ): Promise<boolean> => {
    try {
      const editado = await GestionLeyesService.editarAnalito(id, nombre, esDesplegable);
      setAnalitos((prev) =>
        prev.map((a) => (a.id === id ? editado : a))
      );
      // Actualizar también en el listado de grupos asociados localmente para que se refleje inmediatamente si está en pantalla
      setGrupos((prev) =>
        prev.map((g) => ({
          ...g,
          analitos: g.analitos.map((a) =>
            a.id_analito === id ? { ...a, nombre: editado.nombre, es_desplegable: editado.es_desplegable } : a
          ),
        }))
      );
      notifySuccess("Analito editado correctamente");
      return true;
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || "Ocurrió un error al editar el analito";
      notifyError(msg);
      return false;
    }
  };

  const agregarAnalitoEnLista = (nuevo: AnalitoResponse) => {
    setAnalitos((prev) => [...prev, nuevo]);
  };

  return {
    grupos: gruposFiltrados,
    todosLosGrupos: grupos,
    analitos: analitosActivos,
    todosLosAnalitos: analitos,
    loading,
    busqueda,
    setBusqueda,
    cargarGrupos,
    guardarGrupo,
    toggleEstadoGrupo,
    guardarAnalito,
    editarAnalito,
    toggleEstadoAnalito,
    agregarAnalitoEnLista,
  };
};
