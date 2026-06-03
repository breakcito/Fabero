import { useState } from "react";
import { useNotify } from "./useNotify";
import { AuxService } from "../service/auxiliar.service";
import type { RES_Banco } from "../service/responses/banco";
import z from "zod";

export const useRegistroBanco = (onSuccess: (banco: RES_Banco) => void) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotify();

  const [payload, setPayload] = useState<{
    nombre: string;
    abreviatura: string;
  }>({
    nombre: "",
    abreviatura: "",
  });

  const handleChange = (field: "nombre" | "abreviatura", value: string) => {
    setPayload((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validation = z
      .object({
        nombre: z.string().min(1, "El nombre del banco es requerido"),
        abreviatura: z.string().min(1, "La abreviatura es requerida"),
      })
      .safeParse(payload);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const response = await AuxService.crearBanco(validation.data);
      notifySuccess("Banco registrado exitosamente");
      setPayload({ nombre: "", abreviatura: "" });
      onSuccess(response);
    } catch (e) {
      console.error(e);
      notifyError("Error al registrar banco");
    } finally {
      setLoading(false);
    }
  };

  return { payload, handleChange, submit, loading, error };
};
