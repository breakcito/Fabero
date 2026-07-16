import { useState, useEffect, useMemo } from "react";
import { EmpresasTransporteService } from "../service/empresas-transporte.service";
import type { EmpresaTransporteResponse } from "../service/empresas-transporte.responses";
import { useNotify } from "../../../hooks/useNotify";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export const useEmpresasTransporte = () => {
  const [empresas, setEmpresas] = useState<EmpresaTransporteResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const { notifyError, notifySuccess } = useNotify();

  const fetchEmpresas = async () => {
    setLoading(true);
    try {
      const data = await EmpresasTransporteService.getEmpresasTransporte();
      setEmpresas(data);
    } catch (e) {
      console.error(e);
      notifyError("Ocurrió un error al cargar las empresas de transporte");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const empresasFiltradas = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return empresas;
    return empresas.filter(
      (e) =>
        e.razon_social.toLowerCase().includes(q) ||
        e.ruc.includes(q) ||
        (e.dni && e.dni.includes(q))
    );
  }, [empresas, searchQuery]);

  const insertEmpresa = (e: EmpresaTransporteResponse) => {
    setEmpresas((prev) => {
      const exists = prev.some((item) => item.id === e.id);
      if (exists) {
        return prev.map((item) => (item.id === e.id ? e : item));
      }
      return [e, ...prev];
    });
  };

  const updateEmpresa = (e: EmpresaTransporteResponse) => {
    setEmpresas((prev) => prev.map((item) => (item.id === e.id ? e : item)));
  };

  const toggleEstado = async (id: number, currentEstado: EstadoBase) => {
    const nuevoEstado =
      currentEstado === EstadoBase.Activo ? EstadoBase.Inactivo : EstadoBase.Activo;
    setTogglingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const updated = await EmpresasTransporteService.cambiarEstadoEmpresaTransporte(id, nuevoEstado);
      updateEmpresa(updated);
      notifySuccess(`Empresa de transporte ${nuevoEstado.toLowerCase()} correctamente`);
    } catch (e) {
      console.error(e);
      notifyError("No se pudo cambiar el estado de la empresa de transporte");
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
    empresas: empresasFiltradas,
    loading,
    togglingIds,
    searchQuery,
    setSearchQuery,
    fetchEmpresas,
    insertEmpresa,
    updateEmpresa,
    toggleEstado,
  };
};
