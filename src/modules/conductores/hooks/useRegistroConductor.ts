import { useState } from "react";
import { ConductoresService } from "../service/conductores.service";
import { useNotify } from "../../../hooks/useNotify";
import { Schema_CrearConductor, type CrearConductorRequest } from "../service/conductores.requests";
import type { ConductorResponse } from "../service/conductores.responses";

export const useRegistroConductor = (
  onSuccess: (c: ConductorResponse) => void,
  conductor?: ConductorResponse | null
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotify();

  const [payload, setPayload] = useState<CrearConductorRequest>({
    dni: conductor?.dni || "",
    ruc: conductor?.ruc || "",
    nombre: conductor?.nombre || "",
    apellido: conductor?.apellido || "",
    numero_licencia: conductor?.numero_licencia || "",
  });

  const handleChange = (field: keyof CrearConductorRequest, value: string) => {
    setPayload((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validation = Schema_CrearConductor.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      if (conductor) {
        const updated = await ConductoresService.editarConductor(conductor.id, validation.data);
        notifySuccess("Conductor actualizado exitosamente");
        onSuccess(updated);
      } else {
        const created = await ConductoresService.crearConductor(validation.data);
        notifySuccess("Conductor registrado exitosamente");
        setPayload({
          dni: "",
          ruc: "",
          nombre: "",
          apellido: "",
          numero_licencia: "",
        });
        onSuccess(created);
      }
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || (conductor ? "Ocurrió un error al actualizar el conductor" : "Ocurrió un error al registrar el conductor");
      notifyError(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return { payload, handleChange, submit, loading, error };
};
