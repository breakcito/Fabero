import { useState, useEffect } from "react";
import { AuxService } from "../../../service/auxiliar.service";
import { RecepcionVisitasService } from "../service/recepcion-visitas.service";
import type { CrearRecepcionVisitaRequest } from "../service/recepcion-visitas.requests";
import type { RecepcionVisitaResponse } from "../service/recepcion-visitas.responses";
import type { RES_Empleado } from "../../../service/responses/empleado";
import type { RES_MotivoIngreso } from "../../../service/responses/auxiliar-visitas";
import { useNotify } from "../../../hooks/useNotify";

export interface VisitanteLocal {
  id_visitante?: number;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  foto_documento: File | null;
}

export const useRegistroVisita = (onSuccess: (r: RecepcionVisitaResponse) => void) => {
  const { notifyError, notifySuccess } = useNotify();

  const [payload, setPayload] = useState<Omit<CrearRecepcionVisitaRequest, "visitantes">>({
    id_empleado_contacto: 0,
    id_motivo_ingreso: 0,
    observacion: "",
    con_vehiculo: false,
    serie_placa: "",
    numero_placa: "",
  });

  const [visitantes, setVisitantes] = useState<VisitanteLocal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catálogos
  const [empleados, setEmpleados] = useState<RES_Empleado[]>([]);
  const [motivos, setMotivos] = useState<RES_MotivoIngreso[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  useEffect(() => {
    const fetchCatalogos = async () => {
      setLoadingCatalogos(true);
      try {
        const [empRes, motRes] = await Promise.all([
          AuxService.get_empleados({ estado: "Activo" }),
          AuxService.get_motivos_ingreso(),
        ]);
        if (empRes.success) setEmpleados(empRes.data);
        if (motRes.success) setMotivos(motRes.data);
      } catch (e: unknown) {
        console.error(e);
        notifyError("Error al cargar empleados o motivos de ingreso.");
      } finally {
        setLoadingCatalogos(false);
      }
    };
    fetchCatalogos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = <K extends keyof Omit<CrearRecepcionVisitaRequest, "visitantes">>(
    field: K,
    value: Omit<CrearRecepcionVisitaRequest, "visitantes">[K]
  ) => {
    setPayload((prev) => ({ ...prev, [field]: value }));
  };

  const handleAgregarVisitante = (nuevoVisitante: VisitanteLocal) => {
    // Evitar DNI duplicado en la lista actual
    if (visitantes.some((v) => v.dni === nuevoVisitante.dni)) {
      notifyError("Este visitante ya ha sido agregado a la lista.");
      return;
    }
    setVisitantes((prev) => [...prev, nuevoVisitante]);
  };

  const handleRemoverVisitante = (index: number) => {
    setVisitantes((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!payload.id_empleado_contacto) {
      setError("Debe seleccionar el personal de contacto.");
      return;
    }
    if (!payload.id_motivo_ingreso) {
      setError("Debe seleccionar el motivo de la visita.");
      return;
    }
    if (payload.con_vehiculo) {
      if (!payload.serie_placa?.trim() || !payload.numero_placa?.trim()) {
        setError("Debe completar la serie y número de placa del vehículo.");
        return;
      }
    }
    if (visitantes.length === 0) {
      setError("Debe agregar al menos un visitante.");
      return;
    }

    // Validar foto documento
    const faltanFotos = visitantes.some((v) => !v.foto_documento);
    if (faltanFotos) {
      setError("Todos los visitantes de la lista deben tener una foto del documento cargada.");
      return;
    }

    setLoading(true);

    try {
      const requestPayload: CrearRecepcionVisitaRequest = {
        ...payload,
        visitantes: visitantes.map((v) => ({
          id_visitante: v.id_visitante,
          nombre: v.nombre,
          apellido: v.apellido,
          dni: v.dni,
          telefono: v.telefono,
          foto_documento: v.foto_documento || undefined,
        })),
      };

      const response = await RecepcionVisitasService.crearRecepcion(requestPayload);
      notifySuccess("Visita registrada correctamente");
      onSuccess(response);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || "Ocurrió un error inesperado al registrar la visita.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    payload,
    handleChange,
    visitantes,
    handleAgregarVisitante,
    handleRemoverVisitante,
    submit,
    loading,
    error,
    empleados,
    motivos,
    loadingCatalogos,
  };
};
