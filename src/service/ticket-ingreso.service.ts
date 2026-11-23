import { api } from "./_api";
import type { IRespuesta } from "../shared/interfaces/_response";
import type {
  IGuiaRecepcion,
  IProveedorRecepcion,
} from "../shared/interfaces/guia-recepcion";
import type {
  GuiaRecepcionItem,
  RES_TicketIngresoDisponible,
  RES_TicketIngresoVehiculoData,
} from "./responses/ticket-ingreso-vehiculo";

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
 * Proveedores de la carga de una recepción de unidad (tabla puente
 * `proveedor_recepcion`).
 */
const getProveedoresRecepcion = async (
  idRecepcionUnidad: number,
): Promise<IProveedorRecepcion[]> => {
  const { data } = await api.get<IRespuesta<IProveedorRecepcion[]>>(
    `/recepcion-unidades/${idRecepcionUnidad}/proveedores`,
  );
  assertBusinessSuccess(data);
  return data.data;
};

/**
 * Guías por proveedor de una recepción de unidad (array JSON `guias`).
 */
const getGuiasPorProveedor = async (
  idRecepcionUnidad: number,
): Promise<IGuiaRecepcion[]> => {
  const { data } = await api.get<IRespuesta<IGuiaRecepcion[]>>(
    `/recepcion-unidades/${idRecepcionUnidad}/guias-recepcion`,
  );
  assertBusinessSuccess(data);
  return data.data;
};

/**
 * Servicio global del Ticket de Ingreso de Vehículos con Carga.
 *
 * El ticket se genera al confirmar la llegada de la unidad a planta; antes de
 * eso el backend no devuelve información. Vive fuera de los módulos porque lo
 * consumen tanto `recepcion-unidades` como `programar-recepcion`.
 */
export const TicketIngresoService = {
  /**
   * Datos del Ticket de Ingreso de una recepción de unidad.
   *
   * `idGuia` e `idProveedor` acotan el documento a una guía y a un proveedor
   * concreto: una unidad puede traer la carga de varios proveedores y cada
   * uno tiene su propio ticket.
   */
  getTicketIngreso: async (
    idRecepcionUnidad: number,
    idGuia?: number | null,
    idProveedor?: number | null,
  ): Promise<RES_TicketIngresoVehiculoData> => {
    const params: { id_guia?: number; id_proveedor?: number } = {};
    if (idGuia) params.id_guia = idGuia;
    if (idProveedor) params.id_proveedor = idProveedor;

    const { data } = await api.get<IRespuesta<RES_TicketIngresoVehiculoData>>(
      `/recepcion-unidades/${idRecepcionUnidad}/ticket-ingreso`,
      { params },
    );
    assertBusinessSuccess(data);
    return data.data;
  },

  /**
   * Tickets de ingreso disponibles de una recepción de unidad: uno por
   * proveedor de la carga. Si la unidad sólo trae un proveedor, la lista
   * tiene un único elemento y se puede imprimir directamente.
   */
  getTicketsIngreso: async (
    idRecepcionUnidad: number,
  ): Promise<RES_TicketIngresoDisponible[]> => {
    const { data } = await api.get<IRespuesta<RES_TicketIngresoDisponible[]>>(
      `/recepcion-unidades/${idRecepcionUnidad}/tickets-ingreso`,
    );
    assertBusinessSuccess(data);
    return data.data;
  },

  /**
   * Guías de primer tramo registradas en una recepción de unidad.
   * Si la unidad tiene más de una, se debe elegir con cuál generar el ticket.
   */
  getGuiasRecepcion: async (
    idRecepcionUnidad: number,
  ): Promise<GuiaRecepcionItem[]> => {
    const { data } = await api.get<IRespuesta<GuiaRecepcionItem[]>>(
      `/recepcion-unidades/${idRecepcionUnidad}/guias`,
    );
    assertBusinessSuccess(data);
    return data.data;
  },

  /**
   * Proveedores de la carga de una recepción de unidad (tabla puente
   * `proveedor_recepcion`).
   */
  getProveedoresRecepcion: async (
    idRecepcionUnidad: number,
  ): Promise<IProveedorRecepcion[]> => getProveedoresRecepcion(idRecepcionUnidad),

  /**
   * Guías por proveedor de una recepción de unidad (array JSON `guias`).
   */
  getGuiasPorProveedor: async (
    idRecepcionUnidad: number,
  ): Promise<IGuiaRecepcion[]> => getGuiasPorProveedor(idRecepcionUnidad),
};
