import { useState, useCallback, useEffect } from "react";
import dayjs from "dayjs";
import { BlendingService } from "../service/blending.service";
import type { BlendingResponse } from "../service/blending.responses";
import { useNotify } from "../../../hooks/useNotify";

export const useBlendingList = () => {
  const today = dayjs().format("YYYY-MM-DD");
  const [blendings, setBlendings] = useState<BlendingResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fechaInicio, setFechaInicio] = useState<string>(today);
  const [fechaFin, setFechaFin] = useState<string>(today);
  const { notifyError } = useNotify();

  const fetchBlendings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await BlendingService.get_blendings({
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
      });
      setBlendings(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar la lista de blendings.";
      notifyError(message);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin, notifyError]);

  useEffect(() => {
    fetchBlendings();
  }, [fetchBlendings]);

  return {
    blendings,
    loading,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    refetch: fetchBlendings,
  };
};
