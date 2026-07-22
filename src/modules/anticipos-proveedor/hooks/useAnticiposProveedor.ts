import { useState, useEffect, useCallback } from "react";
import { AuxService } from "../../../service/auxiliar.service";
import type { RES_Proveedor } from "../../../service/responses/proveedor";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import { useNotify } from "../../../hooks/useNotify";

import { AnticiposProveedorService } from "../service/anticipos-proveedor.service";
import type { DTO_CrearAnticipoProveedor } from "../service/anticipos-proveedor.requests";
import type { RES_AnticipoProveedor } from "../service/anticipos-proveedor.responses";

export const useAnticiposProveedor = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [anticipos, setAnticipos] = useState<RES_AnticipoProveedor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [proveedores, setProveedores] = useState<RES_Proveedor[]>([]);
  const [loadingProveedores, setLoadingProveedores] = useState<boolean>(true);

  const [filtroProveedor, setFiltroProveedor] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [anulandoId, setAnulandoId] = useState<number | null>(null);

  // Cargar lista de proveedores
  useEffect(() => {
    let isCancelled = false;
    AuxService.get_proveedores({ estado: EstadoBase.Activo })
      .then((res) => {
        if (!isCancelled && res.success && res.data) {
          setProveedores(res.data);
        }
      })
      .catch((err) => {
        console.error("Error al cargar proveedores:", err);
      })
      .finally(() => {
        if (!isCancelled) {
          setLoadingProveedores(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Cargar anticipos
  const fetchAnticipos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AnticiposProveedorService.get_anticipos({
        id_proveedor_minero: filtroProveedor,
        estado: filtroEstado,
      });

      if (res.success && res.data) {
        setAnticipos(res.data);
      } else {
        setAnticipos([]);
      }
    } catch (e) {
      console.error("Error al cargar anticipos:", e);
      notifyError("Ocurrió un error al cargar la lista de anticipos.");
    } finally {
      setLoading(false);
    }
  }, [filtroProveedor, filtroEstado, notifyError]);

  useEffect(() => {
    fetchAnticipos();
  }, [fetchAnticipos]);

  // Crear anticipo
  const crearAnticipo = async (dto: DTO_CrearAnticipoProveedor): Promise<boolean> => {
    setSubmitting(true);
    try {
      const res = await AnticiposProveedorService.crear_anticipo(dto);
      if (res.success) {
        notifySuccess(res.message || "Anticipo registrado correctamente.");
        await fetchAnticipos();
        return true;
      } else {
        notifyError(res.message || "No se pudo registrar el anticipo.");
        return false;
      }
    } catch (e) {
      console.error(e);
      notifyError("Ocurrió un error al intentar registrar el anticipo.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Anular anticipo
  const anularAnticipo = async (id: number, motivo: string): Promise<boolean> => {
    setAnulandoId(id);
    try {
      const res = await AnticiposProveedorService.anular_anticipo(id, motivo);
      if (res.success) {
        notifySuccess(res.message || "Anticipo anulado correctamente.");
        await fetchAnticipos();
        return true;
      } else {
        notifyError(res.message || "No se pudo anular el anticipo.");
        return false;
      }
    } catch (e) {
      console.error(e);
      notifyError("Ocurrió un error al intentar anular el anticipo.");
      return false;
    } finally {
      setAnulandoId(null);
    }
  };

  return {
    anticipos,
    loading,
    proveedores,
    loadingProveedores,
    filtroProveedor,
    setFiltroProveedor,
    filtroEstado,
    setFiltroEstado,
    submitting,
    anulandoId,
    fetchAnticipos,
    crearAnticipo,
    anularAnticipo,
  };
};
