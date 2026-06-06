import { useState, useEffect } from "react";
import { MarcasService, type MarcaResponse } from "../service/marcas.service";
import { useNotify } from "../../../hooks/useNotify";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export const useMarcas = () => {
  const [marcas, setMarcas] = useState<MarcaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const { notifySuccess, notifyError } = useNotify();

  const fetchMarcas = async () => {
    setLoading(true);
    try {
      const data = await MarcasService.getMarcas();
      setMarcas(data);
    } catch (e) {
      console.error(e);
      notifyError("Ocurrió un error al cargar las marcas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarcas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMarca = async (nombre: string) => {
    try {
      const created = await MarcasService.crearMarca(nombre);
      setMarcas((prev) => {
        const exists = prev.some((item) => item.id === created.id);
        if (exists) return prev.map((item) => (item.id === created.id ? created : item));
        return [...prev, created];
      });
      notifySuccess("Marca creada exitosamente");
      return created;
    } catch (e) {
      console.error(e);
      notifyError("No se pudo crear la marca");
      throw e;
    }
  };

  const updateMarca = async (id: number, nombre: string) => {
    try {
      const updated = await MarcasService.editarMarca(id, nombre);
      setMarcas((prev) => prev.map((item) => (item.id === id ? updated : item)));
      notifySuccess("Marca actualizada exitosamente");
      return updated;
    } catch (e) {
      console.error(e);
      notifyError("No se pudo actualizar la marca");
      throw e;
    }
  };

  const toggleEstadoMarca = async (id: number, currentEstado: EstadoBase) => {
    const nuevoEstado =
      currentEstado === EstadoBase.Activo ? EstadoBase.Inactivo : EstadoBase.Activo;
    try {
      const updated = await MarcasService.cambiarEstadoMarca(id, nuevoEstado);
      setMarcas((prev) => prev.map((item) => (item.id === id ? updated : item)));
      notifySuccess(`Marca ${nuevoEstado.toLowerCase()} correctamente`);
    } catch (e) {
      console.error(e);
      notifyError("No se pudo cambiar el estado de la marca");
    }
  };

  return {
    marcas,
    loading,
    fetchMarcas,
    addMarca,
    updateMarca,
    toggleEstadoMarca,
  };
};
