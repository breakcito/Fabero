import { useState, useEffect } from "react";
import { TiposVehiculoService, type TipoVehiculoResponse } from "../service/tipos-vehiculo.service";
import { useNotify } from "../../../hooks/useNotify";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export const useTiposVehiculo = () => {
  const [tiposVehiculo, setTiposVehiculo] = useState<TipoVehiculoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const { notifySuccess, notifyError } = useNotify();

  const fetchTiposVehiculo = async () => {
    setLoading(true);
    try {
      const data = await TiposVehiculoService.getTiposVehiculo();
      setTiposVehiculo(data);
    } catch (e) {
      console.error(e);
      notifyError("Ocurrió un error al cargar los tipos de vehículo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiposVehiculo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTipoVehiculo = async (nombre: string, tieneCarreta: boolean, esCarreta: boolean) => {
    try {
      const created = await TiposVehiculoService.crearTipoVehiculo(nombre, tieneCarreta, esCarreta);
      setTiposVehiculo((prev) => {
        const exists = prev.some((item) => item.id === created.id);
        if (exists) return prev.map((item) => (item.id === created.id ? created : item));
        return [...prev, created];
      });
      notifySuccess("Tipo de vehículo creado exitosamente");
      return created;
    } catch (e) {
      console.error(e);
      notifyError("No se pudo crear el tipo de vehículo");
      throw e;
    }
  };

  const updateTipoVehiculo = async (
    id: number,
    nombre: string,
    tieneCarreta: boolean,
    esCarreta: boolean
  ) => {
    try {
      const updated = await TiposVehiculoService.editarTipoVehiculo(id, nombre, tieneCarreta, esCarreta);
      setTiposVehiculo((prev) => prev.map((item) => (item.id === id ? updated : item)));
      notifySuccess("Tipo de vehículo actualizado exitosamente");
      return updated;
    } catch (e) {
      console.error(e);
      notifyError("No se pudo actualizar el tipo de vehículo");
      throw e;
    }
  };

  const toggleEstadoTipoVehiculo = async (id: number, currentEstado: EstadoBase) => {
    const nuevoEstado =
      currentEstado === EstadoBase.Activo ? EstadoBase.Inactivo : EstadoBase.Activo;
    try {
      const updated = await TiposVehiculoService.cambiarEstadoTipoVehiculo(id, nuevoEstado);
      setTiposVehiculo((prev) => prev.map((item) => (item.id === id ? updated : item)));
      notifySuccess(`Tipo de vehículo ${nuevoEstado.toLowerCase()} correctamente`);
    } catch (e) {
      console.error(e);
      notifyError("No se pudo cambiar el estado del tipo de vehículo");
    }
  };

  return {
    tiposVehiculo,
    loading,
    fetchTiposVehiculo,
    addTipoVehiculo,
    updateTipoVehiculo,
    toggleEstadoTipoVehiculo,
  };
};
