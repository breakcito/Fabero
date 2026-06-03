import { useState } from "react";
import { useNotify } from "../../../hooks/useNotify";
import { ConcesionesService } from "../service/concesiones.service";
import {
  Schema_CrearConcesion,
  type DTO_CrearConcesion,
} from "../service/concesiones.requests";
import type { RES_Concesion } from "../service/concesiones.responses";

export const useRegistroConcesion = (
  onSuccess: (nueva: RES_Concesion) => void,
) => {
  const { notify } = useNotify();
  const [loading, setLoading] = useState(false);

  const initialValues: DTO_CrearConcesion = {
    nombre: "",
    codigo_concesion: "",
    codigo_reinfo: "",
    ubigeo: "",
    tipo_mineral: "",
  };

  const [form, setForm] = useState<DTO_CrearConcesion>(initialValues);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setField = (field: keyof DTO_CrearConcesion, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const validation = Schema_CrearConcesion.safeParse(form);
    if (!validation.success) {
      notify({ type: "error", content: validation.error.issues[0].message });
      return;
    }

    setLoading(true);
    try {
      const resp = await ConcesionesService.crear_concesion(validation.data);
      if (resp.success) {
        notify({ type: "success", content: resp.message });
        onSuccess(resp.data);
        setForm(initialValues);
      } else {
        notify({ type: "error", content: resp.message });
      }
    } catch {
      notify({ type: "error", content: "Error al registrar la concesión" });
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    setField,
    handleSubmit,
    loading,
  };
};
