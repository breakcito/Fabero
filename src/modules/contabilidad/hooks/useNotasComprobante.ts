import { useCallback, useState } from "react";
import { ContabilidadCompraService } from "../service/contabilidad-compra.service";
import type {
  REQ_AnularNotaComprobante,
  REQ_RegistrarNotaComprobante,
} from "../service/contabilidad-compra.requests";
import { useNotify } from "../../../hooks/useNotify";

/**
 * Hook de notas de crédito / débito sobre comprobantes de compra.
 *
 * Un comprobante puede tener varias notas; cada una se registra o anula de
 * forma independiente. Los estados de carga van por ID para que varios
 * comprobantes se puedan operar en paralelo sin spamear la API.
 */
export const useNotasComprobante = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [registrandoPorId, setRegistrandoPorId] = useState<Record<number, boolean>>(
    {},
  );
  const [anulandoPorId, setAnulandoPorId] = useState<Record<number, boolean>>(
    {},
  );

  const registrarNota = useCallback(
    async (
      idComprobante: number,
      payload: REQ_RegistrarNotaComprobante,
    ): Promise<boolean> => {
      setRegistrandoPorId((prev) => ({ ...prev, [idComprobante]: true }));
      try {
        const res = await ContabilidadCompraService.registrarNota(
          idComprobante,
          payload,
        );
        if (res.success) {
          notifySuccess(res.message || "Nota registrada correctamente");
          return true;
        }
        notifyError(res.message || "Error al registrar la nota");
        return false;
      } catch (err) {
        console.error("Error al registrar la nota:", err);
        notifyError("Ocurrió un error al registrar la nota.");
        return false;
      } finally {
        setRegistrandoPorId((prev) => ({ ...prev, [idComprobante]: false }));
      }
    },
    [notifySuccess, notifyError],
  );

  const anularNota = useCallback(
    async (
      idNota: number,
      payload: REQ_AnularNotaComprobante,
    ): Promise<boolean> => {
      setAnulandoPorId((prev) => ({ ...prev, [idNota]: true }));
      try {
        const res = await ContabilidadCompraService.anularNota(idNota, payload);
        if (res.success) {
          notifySuccess(res.message || "Nota anulada correctamente");
          return true;
        }
        notifyError(res.message || "Error al anular la nota");
        return false;
      } catch (err) {
        console.error("Error al anular la nota:", err);
        notifyError("Ocurrió un error al anular la nota.");
        return false;
      } finally {
        setAnulandoPorId((prev) => ({ ...prev, [idNota]: false }));
      }
    },
    [notifySuccess, notifyError],
  );

  return {
    registrandoPorId,
    anulandoPorId,
    registrarNota,
    anularNota,
  };
};
