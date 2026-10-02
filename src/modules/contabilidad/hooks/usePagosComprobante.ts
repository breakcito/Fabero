import { useState, useCallback } from "react";
import { ContabilidadCompraService } from "../service/contabilidad-compra.service";
import type {
  REQ_AnularPago,
  REQ_RegistrarPago,
} from "../service/contabilidad-compra.requests";
import type { RES_PagoComprobante } from "../service/contabilidad-compra.responses";
import { useNotify } from "../../../hooks/useNotify";

export const usePagosComprobante = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [pagos, setPagos] = useState<RES_PagoComprobante[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [anulandoId, setAnulandoId] = useState<number | null>(null);

  const cargarPagos = useCallback(async (idComprobante: number) => {
    setLoading(true);
    try {
      const res = await ContabilidadCompraService.listarPagos(idComprobante);
      if (res.success) {
        setPagos(res.data);
      } else {
        setPagos([]);
      }
    } catch (err) {
      console.error("Error al cargar pagos:", err);
      notifyError("Ocurrió un error al cargar los pagos.");
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  const registrarPago = async (
    idComprobante: number,
    payload: REQ_RegistrarPago,
  ): Promise<boolean> => {
    setSubmitting(true);
    try {
      const res = await ContabilidadCompraService.registrarPago(idComprobante, payload);
      if (res.success) {
        notifySuccess("Pago registrado correctamente");
        await cargarPagos(idComprobante);
        return true;
      }
      notifyError(res.message || "Error al registrar el pago");
      return false;
    } catch (err) {
      console.error("Error al registrar pago:", err);
      notifyError("Ocurrió un error al registrar el pago.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const anularPago = async (
    idPago: number,
    idComprobante: number,
    payload: REQ_AnularPago,
  ): Promise<boolean> => {
    setAnulandoId(idPago);
    try {
      const res = await ContabilidadCompraService.anularPago(idPago, payload);
      if (res.success) {
        notifySuccess("Pago anulado y dinero devuelto al comprobante");
        await cargarPagos(idComprobante);
        return true;
      }
      notifyError(res.message || "Error al anular el pago");
      return false;
    } catch (err) {
      console.error("Error al anular pago:", err);
      notifyError("Ocurrió un error al anular el pago.");
      return false;
    } finally {
      setAnulandoId(null);
    }
  };

  return {
    pagos,
    loading,
    submitting,
    anulandoId,
    cargarPagos,
    registrarPago,
    anularPago,
  };
};