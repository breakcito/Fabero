import { useState } from "react";
import { PlantasDestinoService } from "../service/plantas-destino.service";
import { useNotify } from "../../../hooks/useNotify";
import {
  Schema_CrearPlantaDestino,
  type CrearPlantaDestinoRequest,
} from "../service/plantas-destino.requests";
import type { PlantaDestinoResponse } from "../service/plantas-destino.responses";

export const useRegistroPlanta = (
  onSuccess: (p: PlantaDestinoResponse) => void,
  planta?: PlantaDestinoResponse | null,
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotify();

  const [payload, setPayload] = useState<CrearPlantaDestinoRequest>({
    ruc: planta?.ruc || "",
    razon_social: planta?.razon_social || "",
    direccion: planta?.direccion || "",
    telefono: planta?.telefono || "",
    correo: planta?.correo || "",
  });

  const handleChange = (field: keyof CrearPlantaDestinoRequest, value: string) => {
    setPayload((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validation = Schema_CrearPlantaDestino.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      if (planta) {
        const updated = await PlantasDestinoService.editarPlanta(planta.id, validation.data);
        notifySuccess("Planta de destino actualizada exitosamente");
        onSuccess(updated);
      } else {
        const created = await PlantasDestinoService.crearPlanta(validation.data);
        notifySuccess("Planta de destino registrada exitosamente");
        setPayload({
          ruc: "",
          razon_social: "",
          direccion: "",
          telefono: "",
          correo: "",
        });
        onSuccess(created);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || (planta ? "Ocurrió un error al actualizar la planta" : "Ocurrió un error al registrar la planta");
      notifyError(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return { payload, handleChange, submit, loading, error };
};
