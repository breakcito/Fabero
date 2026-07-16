import { useCallback, useEffect, useState } from "react";
import { useNotify } from "../../../hooks/useNotify";
import { GuiasPrimerTramoService } from "../service/guias-primer-tramo.service";
import type {
  RES_FiltrosMetadataGuia,
  RES_GuiaPrimerTramo,
} from "../service/guias-primer-tramo.responses";
import type { DTO_CrearGuiaPrimerTramo, DTO_ActualizarGuiaPrimerTramo } from "../service/guias-primer-tramo.requests";

export interface GuiaFilters {
  id_sucursal: number | null;
  id_proveedor?: number | null;
  fecha_inicio?: string;
  fecha_fin?: string;
  guia_remitente?: string;
}

export const useGuiasPrimerTramo = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [guias, setGuias] = useState<RES_GuiaPrimerTramo[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [anulandoId, setAnulandoId] = useState<number | null>(null);
  const [filtrosMetadata, setFiltrosMetadata] = useState<RES_FiltrosMetadataGuia | null>(null);

  const fetchGuias = useCallback(async (filters: GuiaFilters) => {
    if (!filters.id_sucursal) {
      setGuias([]);
      return;
    }
    setLoading(true);
    try {
      const data = await GuiasPrimerTramoService.get_guias({
        id_sucursal: filters.id_sucursal,
        id_proveedor: filters.id_proveedor ?? undefined,
        fecha_inicio: filters.fecha_inicio || undefined,
        fecha_fin: filters.fecha_fin || undefined,
        guia_remitente: filters.guia_remitente || undefined,
      });
      setGuias(data);
    } catch (e) {
      console.error("Error al cargar guías", e);
      notifyError("No se pudieron cargar las guías de primer tramo.");
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  const fetchFiltrosMetadata = useCallback(async (idSucursal: number) => {
    try {
      const data = await GuiasPrimerTramoService.get_filtros_metadata(idSucursal);
      setFiltrosMetadata(data);
    } catch (e) {
      console.error("Error al cargar metadatos de filtros", e);
    }
  }, []);

  const crearGuia = useCallback(
    async (dto: DTO_CrearGuiaPrimerTramo) => {
      setSubmitting(true);
      try {
        const guia = await GuiasPrimerTramoService.crear_guia(dto);
        notifySuccess("Guía de primer tramo registrada correctamente");
        return guia;
      } catch (e: unknown) {
        console.error("Error al crear guía", e);
        // Extraer mensaje real del backend si está disponible
        let msg = "No se pudo registrar la guía de primer tramo.";
        const axiosErr = e as { response?: { data?: { message?: string } } };
        if (axiosErr?.response?.data?.message) {
          msg = axiosErr.response.data.message;
        }
        notifyError(msg);
        throw e;
      } finally {
        setSubmitting(false);
      }
    },
    [notifySuccess, notifyError],
  );

  const actualizarGuia = useCallback(
    async (id: number, dto: DTO_ActualizarGuiaPrimerTramo) => {
      setSubmitting(true);
      try {
        const guia = await GuiasPrimerTramoService.actualizar_guia(id, dto);
        notifySuccess("Guía de primer tramo actualizada correctamente");
        return guia;
      } catch (e: unknown) {
        console.error("Error al actualizar guía", e);
        let msg = "No se pudo actualizar la guía de primer tramo.";
        const axiosErr = e as { response?: { data?: { message?: string } } };
        if (axiosErr?.response?.data?.message) {
          msg = axiosErr.response.data.message;
        }
        notifyError(msg);
        throw e;
      } finally {
        setSubmitting(false);
      }
    },
    [notifySuccess, notifyError],
  );

  const anularGuia = useCallback(
    async (id: number) => {
      setAnulandoId(id);
      try {
        await GuiasPrimerTramoService.anular_guia(id);
        notifySuccess("Guía de primer tramo anulada correctamente");
      } catch (e: unknown) {
        console.error("Error al anular guía", e);
        let msg = "No se pudo anular la guía de primer tramo.";
        const axiosErr = e as { response?: { data?: { message?: string } } };
        if (axiosErr?.response?.data?.message) {
          msg = axiosErr.response.data.message;
        }
        notifyError(msg);
        throw e;
      } finally {
        setAnulandoId(null);
      }
    },
    [notifySuccess, notifyError],
  );

  useEffect(() => {
    return () => {
      setGuias([]);
      setFiltrosMetadata(null);
    };
  }, []);

  return {
    guias,
    loading,
    submitting,
    anulandoId,
    filtrosMetadata,
    fetchGuias,
    fetchFiltrosMetadata,
    crearGuia,
    actualizarGuia,
    anularGuia,
  };
};