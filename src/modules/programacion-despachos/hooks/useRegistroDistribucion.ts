import { useCallback, useState } from "react";
import { ProgramacionDespachosService } from "../service/programacion-despachos.service";
import type {
  CrearDistribucionRequest,
  TipoRemitente,
} from "../service/programacion-despachos.requests";
import type {
  CrearDistribucionResult,
  DespachoDetalleItem,
} from "../service/programacion-despachos.responses";
import { useNotify } from "../../../hooks/useNotify";
import type { MotivoTraslado } from "../../../shared/enums/_generic/motivo-traslado";

type GuiaCampos = {
  motivo_traslado: MotivoTraslado | null;
  fecha_inicio_traslado: string | null;
  fecha_emision: string | null;
  fecha_en_planta: string | null;
  guia_remitente: string;
  guia_transportista: string;
  sin_guia_transportista: boolean;
  id_remitente: number | null;
  tipo_remitente: TipoRemitente | null;
  documento_guia_remitente: File | null;
  documento_guia_transportista: File | null;
};

const GUIA_INICIAL: GuiaCampos = {
  motivo_traslado: null,
  fecha_inicio_traslado: null,
  fecha_emision: null,
  fecha_en_planta: null,
  guia_remitente: "",
  guia_transportista: "",
  sin_guia_transportista: false,
  id_remitente: null,
  tipo_remitente: null,
  documento_guia_remitente: null,
  documento_guia_transportista: null,
};

export const useRegistroDistribucion = (
  _idDespacho: number,
  _detallesDespacho: DespachoDetalleItem[],
  onSuccess: (result: CrearDistribucionResult) => void,
) => {
  const { notifySuccess, notifyError, notifyWarning } = useNotify();

  const [form, setForm] = useState<CrearDistribucionRequest>({
    id_sucursal: 0,
    id_empresa_transporte: 0,
    id_vehiculo: 0,
    id_empresa_transporte_carreta: null,
    id_vehiculo_carreta: null,
    id_tipo_vehiculo: 0,
    id_conductor: 0,
    fecha_estimada_llegada: "",
    detalles: [],
  });

  const [loading, setLoading] = useState(false);
  const [loadingGuia, setLoadingGuia] = useState(false);
  const [advertencias, setAdvertencias] = useState<string[]>([]);

  // Estado para el registro opcional de guía de segundo tramo en el mismo submit.
  const [registrarGuia, setRegistrarGuia] = useState(false);
  const [guia, setGuia] = useState<GuiaCampos>(GUIA_INICIAL);

  const setField = useCallback(
    <K extends keyof CrearDistribucionRequest>(
      key: K,
      value: CrearDistribucionRequest[K],
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setGuiaField = useCallback(
    <K extends keyof GuiaCampos>(key: K, value: GuiaCampos[K]) => {
      setGuia((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const reset = useCallback(() => {
    setForm({
      id_sucursal: 0,
      id_empresa_transporte: 0,
      id_vehiculo: 0,
      id_empresa_transporte_carreta: null,
      id_vehiculo_carreta: null,
      id_tipo_vehiculo: 0,
      id_conductor: 0,
      fecha_estimada_llegada: "",
      detalles: [],
    });
    setAdvertencias([]);
    setRegistrarGuia(false);
    setGuia(GUIA_INICIAL);
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!form.id_sucursal) {
      notifyError("Debe seleccionar la sucursal.");
      return false;
    }
    if (!form.id_empresa_transporte) {
      notifyError("Debe seleccionar la empresa de transporte.");
      return false;
    }
    if (!form.id_vehiculo) {
      notifyError("Debe seleccionar el vehículo.");
      return false;
    }
    if (!form.id_tipo_vehiculo) {
      notifyError("Debe seleccionar el tipo de vehículo.");
      return false;
    }
    if (!form.id_conductor) {
      notifyError("Debe seleccionar el conductor.");
      return false;
    }
    if (!form.fecha_estimada_llegada || form.fecha_estimada_llegada.trim() === "") {
      notifyError("Debe indicar la fecha estimada de llegada.");
      return false;
    }

    const payload: CrearDistribucionRequest = {
      ...form,
      detalles: [],
      fecha_estimada_llegada: form.fecha_estimada_llegada || null,
    };

    setLoading(true);
    setAdvertencias([]);
    try {
      const result = await ProgramacionDespachosService.crearDistribucion(_idDespacho, payload);
      if (!result) {
        notifyError("No se pudo registrar la distribución. Verifica los datos e inténtalo de nuevo.");
        return false;
      }

      // Regla lenient: si el usuario marcó el checkbox y los campos mínimos
      // están llenos (motivo_traslado + guia_remitente), encadenamos la creación
      // de la guía. Si falla, NO revertimos la distribución (queda creada y
      // el usuario puede llenar la guía después desde la card).
      const guiaMinima =
        registrarGuia &&
        guia.motivo_traslado !== null &&
        guia.guia_remitente.trim().length > 0;

      if (guiaMinima && guia.motivo_traslado) {
        setLoadingGuia(true);
        try {
          await ProgramacionDespachosService.crearGuiaSegundoTramo(
            result.id_distribucion,
            {
              motivo_traslado: guia.motivo_traslado,
              fecha_inicio_traslado: guia.fecha_inicio_traslado,
              fecha_emision: guia.fecha_emision,
              fecha_en_planta: guia.fecha_en_planta,
              guia_remitente: guia.guia_remitente.trim(),
              guia_transportista: guia.sin_guia_transportista
                ? null
                : guia.guia_transportista.trim() || null,
              sin_guia_transportista: guia.sin_guia_transportista,
              id_remitente: guia.id_remitente ?? null,
              tipo_remitente: guia.tipo_remitente ?? null,
              documento_guia_remitente: guia.documento_guia_remitente,
              documento_guia_transportista: guia.sin_guia_transportista
                ? null
                : guia.documento_guia_transportista,
            },
          );
        } catch (guiaErr) {
          console.error(guiaErr);
          notifyWarning(
            "Distribución registrada. La guía de segundo tramo no se pudo registrar automáticamente; puedes llenarla después desde la distribución creada.",
          );
        } finally {
          setLoadingGuia(false);
        }
      }

      if (result.advertencias && result.advertencias.length > 0) {
        notifyWarning("Distribución registrada con advertencias");
      } else {
        notifySuccess("Distribución registrada correctamente");
      }
      setAdvertencias(result.advertencias ?? []);
      onSuccess(result);
      return true;
    } catch (e) {
      console.error(e);
      notifyError("Error al registrar la distribución");
      return false;
    } finally {
      setLoading(false);
    }
  }, [form, _idDespacho, notifyError, notifySuccess, notifyWarning, onSuccess, registrarGuia, guia]);

  return {
    form,
    setField,
    reset,
    loading,
    advertencias,
    registrarGuia,
    setRegistrarGuia,
    guia,
    setGuia,
    setGuiaField,
    loadingGuia,
    submit,
  };
};
