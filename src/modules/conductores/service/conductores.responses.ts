import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export interface ConductorResponse {
  id: number;
  dni: string;
  ruc: string | null;
  nombre: string;
  apellido: string;
  numero_licencia: string;
  estado: EstadoBase;
}
