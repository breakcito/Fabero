import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export interface RES_EncargadoMuestra {
  id_encargado_muestra: number;
  dni: string | null;
  ruc: string | null;
  nombre: string;
  apellido: string;
  estado: EstadoBase;
}
