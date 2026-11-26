import { api } from "./_api";
import type { IRespuesta } from "../shared/interfaces/_response";

/**
 * Lectura publicada por una balanza física.
 *
 * `peso` viene en Kg. Es `null` cuando la balanza no tiene lectura
 * pendiente (centinela `-1` en la base) o cuando el valor publicado no es
 * numérico.
 */
export interface RES_PesoBalanza {
  cod_balanza: number;
  peso: number | null;
  descripcion: string | null;
}

const path = "/interfaces-pesosbalanzas";

/**
 * Servicio global de la interfaz con las balanzas físicas.
 *
 * La computadora de la balanza publica el peso en la tabla
 * `interfaces_pesosbalanzas`; este servicio lo lee y devuelve la balanza a su
 * estado de espera cuando el peso ya fue registrado.
 */
export const InterfacesPesosBalanzasService = {
  /**
   * Peso publicado por la balanza (`null` si no hay lectura pendiente).
   */
  get_peso: async (codBalanza?: number | null): Promise<RES_PesoBalanza> => {
    const { data } = await api.get<IRespuesta<RES_PesoBalanza>>(
      `${path}/peso`,
      {
        params: codBalanza ? { cod_balanza: codBalanza } : undefined,
      },
    );

    return data.data;
  },

  /**
   * Devuelve la balanza a su estado de espera (`peso = '-1'`).
   */
  liberar: async (codBalanza?: number | null): Promise<void> => {
    await api.post<IRespuesta<null>>(`${path}/liberar`, null, {
      params: codBalanza ? { cod_balanza: codBalanza } : undefined,
    });
  },
};
