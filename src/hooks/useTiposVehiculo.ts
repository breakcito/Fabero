import { useState, useEffect } from "react";
import { AuxService } from "../service/auxiliar.service";
import type { RES_TipoVehiculo } from "../service/responses/tipo-vehiculo";
import { useNotify } from "./useNotify";
import { EstadoBase } from "../shared/enums/_generic/estado-base";

export const useTiposVehiculo = () => {
  const [tiposVehiculo, setTiposVehiculo] = useState<RES_TipoVehiculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingById, setLoadingById] = useState<Record<number, boolean>>({});
  const { notifySuccess, notifyError } = useNotify();

  const fetchTiposVehiculo = async () => {
    setLoading(true);
    try {
      const data = await AuxService.get_tipos_vehiculo();
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
      const created = await AuxService.crear_tipo_vehiculo(nombre, tieneCarreta, esCarreta);
      setTiposVehiculo((prev) => {
        const exists = prev.some((item) => item.id_tipo_vehiculo === created.id_tipo_vehiculo);
        if (exists) return prev.map((item) => (item.id_tipo_vehiculo === created.id_tipo_vehiculo ? created : item));
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
      const updated = await AuxService.editar_tipo_vehiculo(id, nombre, tieneCarreta, esCarreta);
      setTiposVehiculo((prev) => prev.map((item) => (item.id_tipo_vehiculo === id ? updated : item)));
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
    setLoadingById((prev) => ({ ...prev, [id]: true }));
    try {
      const updated = await AuxService.cambiar_estado_tipo_vehiculo(id, nuevoEstado);
      setTiposVehiculo((prev) => prev.map((item) => (item.id_tipo_vehiculo === id ? updated : item)));
      notifySuccess(`Tipo de vehículo ${nuevoEstado.toLowerCase()} correctamente`);
    } catch (e) {
      console.error(e);
      notifyError("No se pudo cambiar el estado del tipo de vehículo");
    } finally {
      setLoadingById((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  return {
    tiposVehiculo,
    loading,
    loadingById,
    fetchTiposVehiculo,
    addTipoVehiculo,
    updateTipoVehiculo,
    toggleEstadoTipoVehiculo,
  };
};
