import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export interface RES_Concesion {
  id_concesion: number;
  id_departamento: number;
  departamento?: string | null;
  id_provincia: number;
  provincia?: string | null;
  id_distrito: number;
  distrito?: string | null;
  nombre: string;
  codigo_reinfo: string | null;
  estado: EstadoBase;
  contratos_activos: number;
}
