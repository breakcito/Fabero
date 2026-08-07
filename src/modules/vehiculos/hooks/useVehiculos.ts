import { useState, useEffect, useMemo } from "react";
import { VehiculosService } from "../service/vehiculos.service";
import type { VehiculoResponse } from "../service/vehiculos.responses";
import { useNotify } from "../../../hooks/useNotify";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export const useVehiculos = () => {
  const [vehiculos, setVehiculos] = useState<VehiculoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const { notifyError, notifySuccess } = useNotify();

  const fetchVehiculos = async () => {
    setLoading(true);
    try {
      const data = await VehiculosService.getVehiculos();
      setVehiculos(data);
    } catch (e) {
      console.error(e);
      notifyError("Ocurrió un error al cargar los vehículos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehiculos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vehiculosFiltrados = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return vehiculos;
    return vehiculos.filter(
      (v) =>
        v.placa.toLowerCase().includes(q) ||
        v.marca_nombre.toLowerCase().includes(q) ||
        v.tipo_vehiculo_nombre.toLowerCase().includes(q) ||
        v.empresa_transporte_razon_social.toLowerCase().includes(q)
    );
  }, [vehiculos, searchQuery]);

  const insertVehiculo = (v: VehiculoResponse) => {
    setVehiculos((prev) => {
      const exists = prev.some((item) => item.id === v.id);
      if (exists) {
        return prev.map((item) => (item.id === v.id ? v : item));
      }
      return [v, ...prev];
    });
  };

  const updateVehiculo = (v: VehiculoResponse) => {
    setVehiculos((prev) => prev.map((item) => (item.id === v.id ? v : item)));
  };

  const toggleEstado = async (id: number, currentEstado: EstadoBase) => {
    const nuevoEstado =
      currentEstado === EstadoBase.Activo ? EstadoBase.Inactivo : EstadoBase.Activo;
    setTogglingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const updated = await VehiculosService.cambiarEstadoVehiculo(id, nuevoEstado);
      updateVehiculo(updated);
      notifySuccess(`Vehículo ${nuevoEstado.toLowerCase()} correctamente`);
    } catch (e) {
      console.error(e);
      notifyError("No se pudo cambiar el estado del vehículo");
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
    vehiculos: vehiculosFiltrados,
    loading,
    togglingIds,
    searchQuery,
    setSearchQuery,
    fetchVehiculos,
    insertVehiculo,
    updateVehiculo,
    toggleEstado,
  };
};
