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

  /**
   * Persistir SOLO la fecha de llegada al cliente (paso 1 del flujo de 2 pasos).
   * Reutiliza el endpoint existente enviando `detalles: []` — el backend ya
   * lo soporta (ver `actualizar_datos_cliente` en ProgramacionDespachosController).
   * Devuelve el `DespachoDetalle` actualizado o `null` si falla.
   */
  const registrarFechaLlegada = useCallback(
    async (
      idDistribucion: number,
      fecha: string,
    ): Promise<DespachoDetalle | null> => {
      setLoading(true);
      try {
        const result = await ProgramacionDespachosService.actualizarDatosCliente(
          idDistribucion,
          { fecha_llegada_cliente: fecha, detalles: [] },
        );
        notifySuccess("Fecha de llegada al cliente registrada correctamente.");
        return result;
      } catch (e: unknown) {
        notifyError(
          extractErrorMessage(
            e,
            "No se pudo registrar la fecha de llegada al cliente.",
          ),
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [notifyError, notifySuccess],
  );

  return { loading, submit, registrarFechaLlegada };
};
