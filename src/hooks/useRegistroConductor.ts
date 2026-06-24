import { useState } from "react";
import { useNotify } from "./useNotify";
import { AuxService } from "../service/auxiliar.service";
import type { RES_Conductor } from "../service/responses/conductor";
import z from "zod";

export const useRegistroConductor = (onSuccess: (conductor: RES_Conductor) => void) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotify();

  const [payload, setPayload] = useState<{
    dni: string;
    nombre: string;
    apellido: string;
    numero_licencia: string;
  }>({
    dni: "",
    nombre: "",
    apellido: "",
    numero_licencia: "",
  });

  const handleChange = (
    field: "dni" | "nombre" | "apellido" | "numero_licencia",
    value: string,
  ) => {
    setPayload((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "dni") {
        next.numero_licencia = value;
      }
      return next;
    });
    if (error) setError(null);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validation = z
      .object({
        dni: z.string().length(8, "El DNI debe tener exactamente 8 caracteres"),
        nombre: z.string().min(1, "El nombre es requerido"),
        apellido: z.string().min(1, "El apellido es requerido"),
        numero_licencia: z.string().min(1, "El número de licencia es requerido"),
      })
      .safeParse(payload);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const response = await AuxService.crear_conductor(validation.data);
      notifySuccess("Conductor registrado exitosamente");
      setPayload({
        dni: "",
        nombre: "",
        apellido: "",
        numero_licencia: "",
      });
      onSuccess(response);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = axiosError.response?.data?.message || axiosError.message || "Error al registrar conductor";
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  return { payload, handleChange, submit, loading, error };
};
