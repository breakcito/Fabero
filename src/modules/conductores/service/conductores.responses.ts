import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export interface RES_Conductor {
  id_conductor: number;
  dni: string;
  nombre: string;
  apellido: string;
  numero_licencia: string;
  estado: EstadoBase;
}
