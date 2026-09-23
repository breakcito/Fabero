import { useState, useCallback, useEffect } from "react";
import { AuxService } from "../../../service/auxiliar.service";
import { CondicionesComercialesPlantaService } from "../service/condiciones-comerciales-planta.service";
import type { RES_CondicionComercialPlanta } from "../service/condiciones-comerciales-planta.responses";
import type {
  DTO_CrearCondicionComercialPlanta,
  DTO_ActualizarCondicionComercialPlanta,
} from "../service/condiciones-comerciales-planta.requests";
import { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import { useNotify } from "../../../hooks/useNotify";

type PlantaItem = { id: number; ruc: string; razon_social: string };

export const useCondicionesComercialesPlanta = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [plantas, setPlantas] = useState<PlantaItem[]>([]);
  const [idPlantaSeleccionada, setIdPlantaSeleccionada] = useState<number | null>(null);
  const [condiciones, setCondiciones] = useState<RES_CondicionComercialPlanta[]>([]);

  const [loadingPlantas, setLoadingPlantas] = useState(false);
  const [loadingCondiciones, setLoadingCondiciones] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Record<number, boolean>>({});

  const cargarPlantas = useCallback(async () => {
    setLoadingPlantas(true);
    try {
      const res = await AuxService.get_plantas_despachable();
      if (Array.isArray(res)) {
        setPlantas(res);
        setIdPlantaSeleccionada((prev) => (prev === null && res.length > 0 ? res[0].id : prev));
      }
    } catch (err: unknown) {
      console.error(err);
      notifyError("OcurriA3 un error al cargar la lista de plantas destino");
    } finally {
      setLoadingPlantas(false);
    }
  }, [notifyError]);

  const cargarCondiciones = useCallback(async (idPlanta: number) => {
    setLoadingCondiciones(true);
    try {
      const res = await CondicionesComercialesPlantaService.get_condiciones(idPlanta);
      if (res.success && res.data) {
        setCondiciones(res.data);
      }
    } catch (err: unknown) {
      console.error(err);
      notifyError("OcurriA3 un error al cargar las condiciones comerciales de planta");
    } finally {
      setLoadingCondiciones(false);
    }
  }, [notifyError]);

  useEffect(() => {
    void cargarPlantas();
  }, [cargarPlantas]);

  useEffect(() => {
    if (idPlantaSeleccionada !== null) {
      void cargarCondiciones(idPlantaSeleccionada);
    } else {
      setCondiciones([]);
    }
  }, [idPlantaSeleccionada, cargarCondiciones]);

  const crearCondicion = async (
    payload: DTO_CrearCondicionComercialPlanta,
  ): Promise<boolean> => {
    setGuardando(true);
    try {
      const res = await CondicionesComercialesPlantaService.crear_condicion(payload);
      if (res.success) {
        notifySuccess(res.message || "Condición comercial de planta registrada correctamente.");
        await cargarCondiciones(payload.id_planta);
        return true;
      }
      notifyError(res.message || "No se pudo registrar la condición comercial de planta.");
      return false;
    } catch (err) {
      console.error(err);
      notifyError("OcurriA3 un error al intentar registrar la condición comercial de planta.");
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const actualizarCondicion = async (
    id: number,
    payload: DTO_ActualizarCondicionComercialPlanta,
  ): Promise<boolean> => {
    setGuardando(true);
    try {
      const res = await CondicionesComercialesPlantaService.actualizar_condicion(id, payload);
      if (res.success) {
        notifySuccess(res.message || "Condición comercial de planta actualizada correctamente.");
        if (idPlantaSeleccionada !== null) {
          await cargarCondiciones(idPlantaSeleccionada);
        }
        return true;
      }
      notifyError(res.message || "No se pudo actualizar la condición comercial de planta.");
      return false;
    } catch (err) {
      console.error(err);
      notifyError("OcurriA3 un error al intentar actualizar la condición comercial de planta.");
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (id: number, nuevoEstado: EstadoBase): Promise<boolean> => {
    setTogglingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await CondicionesComercialesPlantaService.cambiar_estado(id, nuevoEstado);
      if (res.success) {
        notifySuccess(res.message || "Estado actualizado correctamente.");
        if (idPlantaSeleccionada !== null) {
          await cargarCondiciones(idPlantaSeleccionada);
        }
        return true;
      }
      notifyError(res.message || "No se pudo cambiar el estado.");
      return false;
    } catch (err) {
      console.error(err);
      notifyError("OcurriA3 un error al cambiar el estado.");
      return false;
    } finally {
      setTogglingIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  return {
    plantas,
    idPlantaSeleccionada,
    setIdPlantaSeleccionada,
    condiciones,
    loadingPlantas,
    loadingCondiciones,
    guardando,
    togglingIds,
    crearCondicion,
    actualizarCondicion,
    cambiarEstado,
  };
};
