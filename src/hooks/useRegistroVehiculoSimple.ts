import { useState } from "react";
import { useNotify } from "./useNotify";
import { AuxService } from "../service/auxiliar.service";
import type { RES_Vehiculo } from "../service/responses/vehiculo";
import z from "zod";

/**
 * Hook para registrar un vehículo de forma simplificada (solo serie y placa).
 * Las FKs requeridas por el backend (id_empresa_transporte, id_tipo_vehiculo)
 * se reciben desde el contexto del modal padre para mantener este formulario
 * minimalista en sus inputs visibles.
 */
export const useRegistroVehiculoSimple = (
  onSuccess: (vehiculo: RES_Vehiculo) => void,
  idEmpresaTransporte: number | null,
  idTipoVehiculo: number | null,
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotify();

  const [payload, setPayload] = useState<{
    serie_placa: string;
    numero_placa: string;
  }>({
    serie_placa: "",
    numero_placa: "",
  });

  const handleChange = (field: "serie_placa" | "numero_placa", value: string) => {
    setPayload((prev) => ({ ...prev, [field]: value.toUpperCase() }));
    if (error) setError(null);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (idEmpresaTransporte === null || idTipoVehiculo === null) {
      setError(
        "No se puede registrar el vehículo: faltan los datos de empresa de transporte y/o tipo de vehículo en el contexto.",
      );
      return;
    }

    const validation = z
      .object({
        serie_placa: z.string().max(10, "La serie no debe superar los 10 caracteres"),
        numero_placa: z.string().min(1, "El número de placa es requerido").max(10, "La placa no debe superar los 10 caracteres"),
      })
      .safeParse(payload);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const response = await AuxService.crear_vehiculo({
        serie_placa: validation.data.serie_placa.trim() || null,
        numero_placa: validation.data.numero_placa.trim(),
        id_empresa_transporte: idEmpresaTransporte,
        id_tipo_vehiculo: idTipoVehiculo,
      });
      notifySuccess("Vehículo registrado exitosamente");
      setPayload({ serie_placa: "", numero_placa: "" });
      onSuccess(response);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = axiosError.response?.data?.message || axiosError.message || "Error al registrar vehículo";
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  return { payload, handleChange, submit, loading, error };
};