import { useCallback, useState } from "react";
import { MuestreoService } from "../service/muestreo.service";
import type { DTO_ConfirmarMuestreo } from "../service/muestreo.requests";
import type { RES_LoteMuestreo } from "../service/muestreo.responses";
import { useNotify } from "../../../hooks/useNotify";

/**
 * Estado y acciones del módulo de Muestreo.
 *
 * El listado muestra los lotes que aún no tienen muestreo confirmado
 * (o cuyo correlativo es temporal). Al confirmar, el lote sale del listado.
 */
export const useMuestreo = () => {
  const [lotes, setLotes] = useState<RES_LoteMuestreo[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const { notifySuccess, notifyError } = useNotify();

  const loadLotes = useCallback(
    async (filtros: { fecha_inicio?: string | null; fecha_fin?: string | null } = {}) => {
      setLoading(true);
      try {
        const data = await MuestreoService.get_lotes(filtros);
        setLotes(data);
      } catch (e) {
        console.error("Error al cargar los lotes pendientes de muestreo", e);
        notifyError(
          e instanceof Error
            ? e.message
            : "Ocurrió un error al cargar los lotes pendientes de muestreo",
        );
      } finally {
        setLoading(false);
      }
    },
    [notifyError],
  );

  /**
   * Confirma el muestreo de un lote y refresca el listado.
   */
  const confirmarMuestreo = useCallback(
    async (idLote: number, dto: DTO_ConfirmarMuestreo): Promise<boolean> => {
      setConfirmando(true);
      try {
        await MuestreoService.confirmar_muestreo(idLote, dto);
        notifySuccess("Muestreo confirmado correctamente");
        await loadLotes();
        return true;
      } catch (e) {
        console.error("Error al confirmar el muestreo", e);
        notifyError(
          e instanceof Error
            ? e.message
            : "No se pudo confirmar el muestreo del lote",
        );
        return false;
      } finally {
        setConfirmando(false);
      }
    },
    [loadLotes, notifyError, notifySuccess],
  );

  return {
    lotes,
    loading,
    confirmando,
    loadLotes,
    confirmarMuestreo,
  };
};
