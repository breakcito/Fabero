import { useCallback, useState } from "react";
import { useNotify } from "../../../hooks/useNotify";
import { ProgramacionDespachosService } from "../service/programacion-despachos.service";
import type { DTO_DatosCliente } from "../service/programacion-despachos.requests";
import type { DespachoDetalle } from "../service/programacion-despachos.responses";

const extractErrorMessage = (e: unknown, fallback: string): string => {
  const axiosErr = e as { response?: { data?: { message?: string } } };
  if (axiosErr?.response?.data?.message) {
    return axiosErr.response.data.message;
  }
  return fallback;
};

export const useLlegadaCliente = () => {
  const { notifySuccess, notifyError } = useNotify();

  const [loading, setLoading] = useState(false);

  /**
   * Persistir los datos reportados por el cliente (fecha de llegada + datos por detalle).
   * Devuelve el `DespachoDetalle` actualizado o `null` si falla.
   */
  const submit = useCallback(
    async (
      idDistribucion: number,
      payload: DTO_DatosCliente,
    ): Promise<DespachoDetalle | null> => {
      setLoading(true);
      try {
        const result = await ProgramacionDespachosService.actualizarDatosCliente(
          idDistribucion,
          payload,
        );
        notifySuccess("Datos del cliente guardados correctamente.");
        return result;
      } catch (e: unknown) {
        notifyError(
          extractErrorMessage(
            e,
            "No se pudieron guardar los datos del cliente.",
          ),
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [notifyError, notifySuccess],
  );

  return { loading, submit };
};
