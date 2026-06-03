import { useState } from "react";
import { useNotify } from "../../../hooks/useNotify";
import { OrganigramaService } from "../service/organigrama.service";
import { Schema_RegistroArea } from "../service/organigrama.requests";
import type { RES_Area } from "../service/organigrama.responses";

export const useRegistroArea = (
  onSuccess: (a: RES_Area) => void,
  onClose: () => void,
) => {
  const { notify } = useNotify();
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGuardar = async () => {
    setError("");
    const validation = Schema_RegistroArea.safeParse({ nombre });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const resp = await OrganigramaService.crear_area(validation.data);
      if (resp.success) {
        notify({ type: "success", content: "Área creada" });
        onSuccess(resp.data);
        onClose();
        setNombre("");
      } else {
        setError(resp.message);
      }
    } catch (err) {
      console.error(err);
      setError("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return { nombre, setNombre, loading, error, handleGuardar };
};
