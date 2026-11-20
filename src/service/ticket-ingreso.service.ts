import { api } from "./_api";
import type { IRespuesta } from "../shared/interfaces/_response";
import type { RES_TicketIngresoVehiculoData } from "./responses/ticket-ingreso-vehiculo";

/**
 * Lanza un Error con el `message` real del backend cuando `success === false`,
 * para que el `catch` del consumidor muestre el mensaje al usuario.
 */
const assertBusinessSuccess = (data: {
  success?: boolean;
  message?: string | null;
}): void => {
  if (data.success === false) {
    throw new Error(data.message || "Operación rechazada por el servidor.");
  }
};

/**
 * Servicio global del Ticket de Ingreso de Vehículos con Carga.
 *
 * El ticket se genera al confirmar la llegada de la unidad a planta; antes de
 * eso el backend no devuelve información. Vive fuera de los módulos porque lo
 * consumen tanto `recepcion-unidades` como `programar-recepcion`.
 */
export const TicketIngresoService = {
  getTicketIngreso: async (
    idRecepcionUnidad: number,
    idGuia?: number,
  ): Promise<RES_TicketIngresoVehiculoData> => {
    const { data } = await api.get<IRespuesta<RES_TicketIngresoVehiculoData>>(
      `/recepcion-unidades/${idRecepcionUnidad}/ticket-ingreso`,
      {
        params: idGuia ? { id_guia: idGuia } : undefined,
      },
    );
    assertBusinessSuccess(data);
    return data.data;
  },
};
