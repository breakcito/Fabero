import type { IArchivo } from "../../../shared/interfaces/archivo";
import type { TipoIngreso, TipoCarga, EstadoUnidad, EstadoSalida } from "../enums";

export interface RecepcionUnidadResponse {
  id: number;
  id_empleado_registro: number;
  empleado_registro_nombre: string;
  id_vehiculo: number;
  vehiculo_placa: string;
  vehiculo_serie: string | null;
  id_empresa_transporte: number;
  empresa_transporte_razon_social: string;
  id_tipo_vehiculo: number;
  tipo_vehiculo_nombre: string;
  id_conductor: number;
  conductor_nombre_completo: string;
  conductor_dni: string;
  tipo_ingreso: TipoIngreso;
  tipo_carga: TipoCarga;
  segunda_placa: string | null;
  fecha_hora_ingreso: string;
  evidencias: IArchivo[];
  observacion: string | null;
  estado: EstadoUnidad;
  estado_salida: EstadoSalida | null;
  fecha_hora_salida: string | null;
  observacion_salida: string | null;
}
