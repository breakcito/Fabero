import { api } from "../../../service/_api";
import type { RES_Sucursal } from "./sucursales.responses";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type { DTO_RegistroSucursal } from "./sucursales.requests";

export class SucursalesService {
  private static PATH = "/sucursales";

  /**
   * Obtener listado de todas las sucursales
   */
  public static get_sucursales = async (): Promise<IRespuesta<RES_Sucursal[]>> => {
    const { data } = await api.get<IRespuesta<RES_Sucursal[]>>(`${this.PATH}`);
    return data;
  };

  /**
   * Crear una nueva sucursal
   */
  public static crear_sucursal = async (
    data: DTO_RegistroSucursal,
  ): Promise<IRespuesta<RES_Sucursal>> => {
    const { data: response } = await api.post<IRespuesta<RES_Sucursal>>(
      `${this.PATH}`,
      data,
    );
    return response;
  };
}
