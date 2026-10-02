import { useState } from "react";
import { ContabilidadVentaService } from "../service/contabilidad-venta.service";
import type { REQ_AnularPagoVenta } from "../service/contabilidad-venta.requests";
import type { RES_PagoComprobanteVenta } from "../service/contabilidad-venta.responses";
import { useNotify } from "../../../hooks/useNotify";

export const usePagosComprobanteVenta = () => {
  const { notifySuccess, notifyError } = useNotify();
  const [pagos, setPagos] = useState<RES_PagoComprobanteVenta[]>([]);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [anulandoPagoId, setAnulandoPagoId] = useState<number | null>(null);

  const cargarPagos = async (idComprobante: number) => {
    setLoadingPagos(true);
    try {
      const res = await ContabilidadVentaService.listarPagos(idComprobante);
      if (res.success && res.data) {
        setPagos(res.data);
      } else {
        setPagos([]);
      }
    } catch (e: unknown) {
      console.error("Error al cargar pagos:", e);
      notifyError("Error al cargar pagos.");
    } finally {
      setLoadingPagos(false);
    }
  };

  const anularPago = async (
    idPago: number,
    idComprobante: number,
    payload: REQ_AnularPagoVenta,
  ): Promise<boolean> => {
    setAnulandoPagoId(idPago);
    try {
      const res = await ContabilidadVentaService.anularPago(idPago, idComprobante, payload);
      if (res.success) {
        notifySuccess("Pago anulado exitosamente.");
        await cargarPagos(idComprobante);
        return true;
      }
      notifyError(res.message || "Error al anular pago.");
      return false;
    } catch (e: unknown) {
      console.error("Error al anular pago:", e);
      notifyError("Error al anular pago.");
      return false;
    } finally {
      setAnulandoPagoId(null);
    }
  };

  return {
    pagos,
    loadingPagos,
    anulandoPagoId,
    cargarPagos,
    anularPago,
  };
};
