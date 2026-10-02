import { useCallback, useEffect, useState } from "react";
import { ContabilidadVentaService } from "../service/contabilidad-venta.service";
import type { REQ_CrearComprobanteVenta, REQ_AnularComprobanteVenta } from "../service/contabilidad-venta.requests";
import type { RES_ComprobanteVenta } from "../service/contabilidad-venta.responses";
import { useNotify } from "../../../hooks/useNotify";
import {
  defaultFechaInicio,
  defaultFechaFin,
} from "../../../presentation/utils/filtro-rango-fechas";

export const useComprobantesVenta = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [idPlantaFiltro, setIdPlantaFiltro] = useState<number | null>(null);
  const [estadoFiltro, setEstadoFiltro] = useState<string>("Todos");
  const [fechaInicio, setFechaInicio] = useState<string>(defaultFechaInicio());
  const [fechaFin, setFechaFin] = useState<string>(defaultFechaFin());

  const [comprobantes, setComprobantes] = useState<RES_ComprobanteVenta[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [anulandoId, setAnulandoId] = useState<number | null>(null);

  const cargarComprobantes = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);
      try {
        const res = await ContabilidadVentaService.listarComprobantes({
          id_planta: idPlantaFiltro ?? undefined,
          estado: estadoFiltro === "Todos" ? undefined : estadoFiltro,
          fecha_inicio: fechaInicio || undefined,
          fecha_fin: fechaFin || undefined,
        });
        if (res.success && res.data) {
          setComprobantes(res.data);
        } else {
          setComprobantes([]);
        }
      } catch (e: unknown) {
        console.error("Error al cargar comprobantes de venta:", e);
        notifyError("Error al cargar comprobantes de venta.");
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [idPlantaFiltro, estadoFiltro, fechaInicio, fechaFin, notifyError],
  );

  useEffect(() => {
    cargarComprobantes(true);
  }, [cargarComprobantes]);

  const crearComprobante = async (payload: REQ_CrearComprobanteVenta): Promise<boolean> => {
    setSubmitting(true);
    try {
      const res = await ContabilidadVentaService.crearComprobante(payload);
      if (res.success) {
        notifySuccess("Comprobante de venta creado exitosamente.");
        await cargarComprobantes(false);
        return true;
      }
      notifyError(res.message || "Error al crear comprobante.");
      return false;
    } catch (e: unknown) {
      console.error("Error al crear comprobante:", e);
      notifyError("Error al crear comprobante.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const anularComprobante = async (
    id: number,
    payload: REQ_AnularComprobanteVenta,
  ): Promise<boolean> => {
    setAnulandoId(id);
    try {
      const res = await ContabilidadVentaService.anularComprobante(id, payload);
      if (res.success) {
        notifySuccess("Comprobante de venta anulado exitosamente.");
        await cargarComprobantes(false);
        return true;
      }
      notifyError(res.message || "Error al anular comprobante.");
      return false;
    } catch (e: unknown) {
      console.error("Error al anular comprobante:", e);
      notifyError("Error al anular comprobante.");
      return false;
    } finally {
      setAnulandoId(null);
    }
  };

  return {
    idPlantaFiltro,
    setIdPlantaFiltro,
    estadoFiltro,
    setEstadoFiltro,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    loading,
    comprobantes,
    anulandoId,
    submitting,
    cargarComprobantes,
    crearComprobante,
    anularComprobante,
  };
};
