import { useState, useEffect } from "react";
import { useNotify } from "../../../hooks/useNotify";
import { OrganigramaService } from "../service/organigrama.service";
import { Schema_RegistroCargo } from "../service/organigrama.requests";
import type { RES_Cargo } from "../service/organigrama.responses";

export const useRegistroCargo = (
  onSuccess: (c: RES_Cargo) => void,
  onClose: () => void,
  defaultAreaId?: number,
) => {
  const { notify } = useNotify();
  const [nombre, setNombre] = useState("");
  const [idArea, setIdArea] = useState<string | null>(
    defaultAreaId?.toString() || null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (defaultAreaId) {
      setIdArea(defaultAreaId.toString());
    }
  }, [defaultAreaId]);

  const handleGuardar = async () => {
    setError("");
    const validation = Schema_RegistroCargo.safeParse({
      nombre,
      id_area: idArea ? parseInt(idArea) : 0,
    });

    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const resp = await OrganigramaService.crear_cargo(validation.data);
      if (resp.success) {
        notify({ type: "success", content: "Cargo creado" });
        onSuccess(resp.data);
        onClose();
        setNombre("");
      } else {
        setError(resp.message);
      }
    } catch {
      setError("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return {
    nombre,
    setNombre,
    idArea,
    setIdArea,
    loading,
    error,
    handleGuardar,
  };
};
