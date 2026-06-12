import type { EstadoBase } from "../../shared/enums/_generic/estado-base";

export interface RES_TipoVehiculo {
  id_tipo_vehiculo: number;
  nombre: string;
  tiene_carreta: boolean;
  es_carreta: boolean;
  estado: EstadoBase;
}
