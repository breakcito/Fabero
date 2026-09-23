import { useState, useEffect, useCallback } from "react";
import { AuxService } from "../../../service/auxiliar.service";
import { useNotify } from "../../../hooks/useNotify";

import { AnticiposPlantaService } from "../service/anticipos-planta.service";
import type { DTO_CrearAnticipoPlanta } from "../service/anticipos-planta.requests";
import type { RES_AnticipoPlanta } from "../service/anticipos-planta.responses";

export const useAnticiposPlanta = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [anticipos, setAnticipos] = useState<RES_AnticipoPlanta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [plantas, setPlantas] = useState<
    Array<{ id: number; ruc: string; razon_social: string }>
  >([]);
  const [loadingPlantas, setLoadingPlantas] = useState<boolean>(true);

  const [filtroPlanta, setFiltroPlanta] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [anulandoId, setAnulandoId] = useState<number | null>(null);

  // Cargar lista de plantas destino activas (catálogo para el dropdown).
  useEffect(() => {
    let isCancelled = false;
    AuxService.get_plantas_despachable()
      .then((res) => {
        if (!isCancelled && Array.isArray(res)) {
          setPlantas(res);
        }
      })
      .catch((err) => {
        console.error("Error al cargar plantas destino:", err);
      })
      .finally(() => {
        if (!isCancelled) {
          setLoadingPlantas(false);
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
      const res = await AnticiposPlantaService.get_anticipos({
        id_planta: filtroPlanta,
        estado: filtroEstado,
      });

      if (res.success && res.data) {
        setAnticipos(res.data);
      } else {
        setAnticipos([]);
      }
    } catch (e) {
      console.error("Error al cargar anticipos de planta:", e);
      notifyError("OcurriA3 un error al cargar la lista de anticipos de planta.");
    } finally {
      setLoading(false);
    }
  }, [filtroPlanta, filtroEstado, notifyError]);

  useEffect(() => {
    fetchAnticipos();
  }, [fetchAnticipos]);

  // Crear anticipo
  const crearAnticipo = async (dto: DTO_CrearAnticipoPlanta): Promise<boolean> => {
    setSubmitting(true);
    try {
      const res = await AnticiposPlantaService.crear_anticipo(dto);
      if (res.success) {
        notifySuccess(res.message || "Anticipo de planta registrado correctamente.");
        await fetchAnticipos();
        return true;
      } else {
        notifyError(res.message || "No se pudo registrar el anticipo de planta.");
        return false;
      }
    } catch (e) {
      console.error(e);
      notifyError("OcurriA3 un error al intentar registrar el anticipo de planta.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // Anular anticipo
  const anularAnticipo = async (id: number, motivo: string): Promise<boolean> => {
    setAnulandoId(id);
    try {
      const res = await AnticiposPlantaService.anular_anticipo(id, motivo);
      if (res.success) {
        notifySuccess(res.message || "Anticipo de planta anulado correctamente.");
        await fetchAnticipos();
        return true;
      } else {
        notifyError(res.message || "No se pudo anular el anticipo de planta.");
        return false;
      }
    } catch (e) {
      console.error(e);
      notifyError("OcurriA3 un error al intentar anular el anticipo de planta.");
      return false;
    } finally {
      setAnulandoId(null);
    }
  };

  return {
    anticipos,
    loading,
    plantas,
    loadingPlantas,
    filtroPlanta,
    setFiltroPlanta,
    filtroEstado,
    setFiltroEstado,
    submitting,
    anulandoId,
    fetchAnticipos,
    crearAnticipo,
    anularAnticipo,
  };
};
