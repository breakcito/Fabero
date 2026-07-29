import { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import { ContabilidadCompraService } from "../service/contabilidad-compra.service";
import type {
  REQ_AnularComprobante,
  REQ_AprobarComprobante,
  REQ_CrearComprobante,
  REQ_FiltroComprobantes,
} from "../service/contabilidad-compra.requests";
import type { RES_ComprobanteCompra } from "../service/contabilidad-compra.responses";
import { useNotify } from "../../../hooks/useNotify";

const todayStr = (): string => dayjs().format("YYYY-MM-DD");

export const useComprobantesCompra = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [idProveedorFiltro, setIdProveedorFiltro] = useState<number | null>(null);
  const [estadoFiltro, setEstadoFiltro] = useState<string>("Todos");
  const [fechaInicio, setFechaInicio] = useState<string | null>(todayStr());
  const [fechaFin, setFechaFin] = useState<string | null>(todayStr());

  const [comprobantes, setComprobantes] = useState<RES_ComprobanteCompra[]>([]);
  const [loading, setLoading] = useState(false);

  const [aprobandoId, setAprobandoId] = useState<Record<number, boolean>>({});
  const [anulandoId, setAnulandoId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cargarComprobantes = useCallback(async () => {
    setLoading(true);
    try {
      const filters: REQ_FiltroComprobantes = {};
      if (idProveedorFiltro !== null) filters.id_proveedor = idProveedorFiltro;
      if (estadoFiltro !== "Todos") filters.estado = estadoFiltro;
      if (fechaInicio) filters.fecha_inicio = fechaInicio;
      if (fechaFin) filters.fecha_fin = fechaFin;

      const res = await ContabilidadCompraService.listarComprobantes(filters);
      if (res.success) {
        setComprobantes(res.data);
      } else {
        setComprobantes([]);
      }
    } catch (err) {
      console.error("Error al cargar comprobantes:", err);
      notifyError("Ocurrió un error al cargar la lista de comprobantes.");
    } finally {
      setLoading(false);
    }
  }, [idProveedorFiltro, estadoFiltro, fechaInicio, fechaFin, notifyError]);

  useEffect(() => {
    cargarComprobantes();
  }, [cargarComprobantes]);

  const crearComprobante = async (
    payload: REQ_CrearComprobante,
  ): Promise<boolean> => {
    setSubmitting(true);
    try {
      const res = await ContabilidadCompraService.crearComprobante(payload);
      if (res.success) {
        notifySuccess("Comprobante creado correctamente");
        await cargarComprobantes();
        return true;
      }
      notifyError(res.message || "Error al crear el comprobante");
      return false;
    } catch (err) {
      console.error("Error al crear comprobante:", err);
      notifyError("Ocurrió un error al crear el comprobante.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const aprobarComprobante = async (
    id: number,
    payload: REQ_AprobarComprobante,
  ): Promise<boolean> => {
    setAprobandoId((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await ContabilidadCompraService.aprobarComprobante(id, payload);
      if (res.success) {
        notifySuccess("Aprobación registrada correctamente");
        await cargarComprobantes();
        return true;
      }
      notifyError(res.message || "Error al aprobar");
      return false;
    } catch (err) {
      console.error("Error al aprobar:", err);
      notifyError("Ocurrió un error al aprobar el comprobante.");
      return false;
    } finally {
      setAprobandoId((prev) => ({ ...prev, [id]: false }));
    }
  };

  const anularComprobante = async (
    id: number,
    payload: REQ_AnularComprobante,
  ): Promise<boolean> => {
    setAnulandoId(id);
    try {
      const res = await ContabilidadCompraService.anularComprobante(id, payload);
      if (res.success) {
        notifySuccess("Comprobante anulado (cascada aplicada a sus pagos)");
        await cargarComprobantes();
        return true;
      }
      notifyError(res.message || "Error al anular");
      return false;
    } catch (err) {
      console.error("Error al anular:", err);
      notifyError("Ocurrió un error al anular el comprobante.");
      return false;
    } finally {
      setAnulandoId(null);
    }
  };

  return {
    idProveedorFiltro,
    setIdProveedorFiltro,
    estadoFiltro,
    setEstadoFiltro,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    loading,
    comprobantes,
    aprobandoId,
    anulandoId,
    submitting,
    cargarComprobantes,
    crearComprobante,
    aprobarComprobante,
    anularComprobante,
  };
};