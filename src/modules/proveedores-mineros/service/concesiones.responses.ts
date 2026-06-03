import { TipoMineral } from "../../../shared/enums/_generic/tipo-mineral";

export interface RES_Concesion {
  id_concesion: number;
  nombre: string;
  codigo_concesion: string;
  codigo_reinfo: string | null;
  ubigeo: string | null;
  tipo_mineral: TipoMineral | string;
  estado: string;
  contratos_activos: number;
}
