import { useCallback, useEffect, useState } from "react";
import { ProgramacionDespachosService } from "../service/programacion-despachos.service";
import { AuxService } from "../../../service/auxiliar.service";
import type {
  CrearDistribucionRequest,
} from "../service/programacion-despachos.requests";
import type {
  CrearDistribucionResult,
  DespachoDetalleItem,
} from "../service/programacion-despachos.responses";
import { useNotify } from "../../../hooks/useNotify";
import type { MotivoTraslado } from "../../../shared/enums/_generic/motivo-traslado";

// `tipo_remitente` NO se persiste como columna; el backend lo infiere del FK
// seteado. Solo guardamos `id_remitente` en estado local.
type GuiaCampos = {
  motivo_traslado: MotivoTraslado | null;
  fecha_inicio_traslado: string | null;
  fecha_emision: string | null;
  fecha_en_planta: string | null;
  guia_remitente: string;
  guia_transportista: string;
  sin_guia_transportista: boolean;
  id_remitente: number | null;
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

  // Estado para el remitente de la guía (Empresa o Planta destino).
  const [esPlantaDestinoRemitente, setEsPlantaDestinoRemitente] = useState(false);
  const [remitenteId, setRemitenteId] = useState<string | null>(null);
  // El catálogo de empresas usa `id_empresa` como PK; el de plantas usa `id`.
  // Para simplificar el mapeo en el UI, los proyectamos a un shape uniforme.
  const [empresasRemitente, setEmpresasRemitente] = useState<
    Array<{ id: number; razon_social: string; ruc: string }>
  >([]);
  const [plantasRemitente, setPlantasRemitente] = useState<
    Array<{ id: number; ruc: string; razon_social: string }>
  >([]);
  const [loadingCatalogosRemitente, setLoadingCatalogosRemitente] = useState(false);

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
    setEsPlantaDestinoRemitente(false);
    setRemitenteId(null);
  }, []);

  // Cargar catálogos de empresas y plantas destino para el selector de
  // remitente de la guía (solo si el usuario marca "También registrar la guía").
  useEffect(() => {
    if (!registrarGuia) return;

    let cancelled = false;
    const cargar = async () => {
      setLoadingCatalogosRemitente(true);
      try {
        const [emps, pls] = await Promise.all([
          AuxService.get_empresas()
            .then((res) => {
              const data = Array.isArray(res?.data) ? res.data : [];
              return data.map((e) => ({
                id: e.id_empresa,
                razon_social: e.razon_social,
                ruc: e.ruc,
              }));
            })
            .catch(() => []),
          AuxService.get_plantas_despachable()
            .then((res) => (Array.isArray(res) ? res : []))
            .catch(() => []),
        ]);
        if (!cancelled) {
          setEmpresasRemitente(emps);
          setPlantasRemitente(pls);
        }
      } finally {
        if (!cancelled) setLoadingCatalogosRemitente(false);
      }
    };
    cargar();

    return () => {
      cancelled = true;
    };
  }, [registrarGuia]);

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
          // Solo se envía id_remitente. El backend infiere si es Empresa o
          // Planta destino según el FK que se setee en el INSERT.
          const idRemitenteNum = remitenteId ? Number(remitenteId) : null;

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
              id_remitente: idRemitenteNum ?? guia.id_remitente ?? null,
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
  }, [
    form,
    _idDespacho,
    notifyError,
    notifySuccess,
    notifyWarning,
    onSuccess,
    registrarGuia,
    guia,
    remitenteId,
    esPlantaDestinoRemitente,
  ]);

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
    // Remitente de la guía
    esPlantaDestinoRemitente,
    setEsPlantaDestinoRemitente,
    remitenteId,
    setRemitenteId,
    empresasRemitente,
    plantasRemitente,
    loadingCatalogosRemitente,
  };
};
