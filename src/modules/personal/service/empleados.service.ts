import { api } from "../../../service/_api";
import type { IRespuesta } from "../../../shared/interfaces/_response";
import type { DTO_CrearEmpleado, DTO_EditarEmpleado } from "./empleados.requests";
import type {
  RES_Area,
  RES_Cargo,
  RES_EmpleadoResumen,
} from "./empleados.responses";

export class EmpleadosService {
  private static PATH = "/empleados";

  public static get_empleados = async (
    idEmpresa?: number,
  ): Promise<IRespuesta<RES_EmpleadoResumen[]>> => {
    const { data } = await api.get(this.PATH, {
      params: { id_empresa: idEmpresa },
    });
    return data;
  };

  public static get_areas = async (): Promise<IRespuesta<RES_Area[]>> => {
    const { data } = await api.get(`${this.PATH}/areas`);
    return data;
  };

  public static get_cargos = async (
    idArea: number,
  ): Promise<IRespuesta<RES_Cargo[]>> => {
    const { data } = await api.get(`${this.PATH}/cargos/${idArea}`);
    return data;
  };

  /**
   * Arma el FormData del empleado. Los valores `null` se omiten y los
   * booleanos se envían como "1"/"0".
   */
  private static toFormData(dto: DTO_CrearEmpleado | DTO_EditarEmpleado) {
    const formData = new FormData();
    Object.entries(dto).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === "boolean") {
        formData.append(key, value ? "1" : "0");
      } else {
        formData.append(key, String(value));
      }
    });
    return formData;
  }

  public static crear_empleado = async (
    dto: DTO_CrearEmpleado,
  ): Promise<IRespuesta<RES_EmpleadoResumen>> => {
    const { data } = await api.post(this.PATH, this.toFormData(dto), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  };

  public static actualizar_empleado = async (
    idEmpleado: number,
    dto: DTO_EditarEmpleado,
  ): Promise<IRespuesta<RES_EmpleadoResumen>> => {
    const { data } = await api.put(
      `${this.PATH}/${idEmpleado}`,
      this.toFormData(dto),
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data;
  };

  public static actualizar_foto = async (
    idEmpleado: number,
    file: File,
  ): Promise<IRespuesta<RES_EmpleadoResumen>> => {
    const formData = new FormData();
    formData.append("path_foto", file);
    const { data } = await api.post(
      `${this.PATH}/foto/${idEmpleado}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data;
  };
}
