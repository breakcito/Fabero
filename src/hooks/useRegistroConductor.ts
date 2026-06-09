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
    ruc: string;
    nombre: string;
    apellido: string;
    numero_licencia: string;
  }>({
    dni: "",
    ruc: "",
    nombre: "",
    apellido: "",
    numero_licencia: "",
  });

  const handleChange = (
    field: "dni" | "ruc" | "nombre" | "apellido" | "numero_licencia",
    value: string,
  ) => {
    setPayload((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validation = z
      .object({
        dni: z.string().min(1, "El DNI es requerido"),
        ruc: z.string().optional().transform((v) => v || null),
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
        ruc: "",
        nombre: "",
        apellido: "",
        numero_licencia: "",
      });
      onSuccess(response);
    } catch (e) {
      console.error(e);
      notifyError("Error al registrar conductor");
    } finally {
      setLoading(false);
    }
  };

  return { payload, handleChange, submit, loading, error };
};
