import { api } from "./_api";

export class ArchivoService {
  private static PATH = "/download-archivo";

  /**
   * Realiza la petición al API para obtener el blob del archivo.
   */
  public static descargarArchivo = async (
    pathRelativo: string,
    nombre: string,
  ): Promise<Blob> => {
    const { data } = await api.get(`${this.PATH}`, {
      params: {
        path_relativo: pathRelativo,
        nombre: nombre,
      },
      responseType: "blob",
    });
    return data;
  };
}
