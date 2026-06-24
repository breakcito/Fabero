import type { IArchivo } from "../../../shared/interfaces/archivo";
import type { TipoIngreso } from "../../../shared/enums/_generic/tipo-ingreso";
import type { TipoCarga } from "../../../shared/enums/_generic/tipo-carga";
import type { EstadoUnidad } from "../../../shared/enums/_generic/estado-unidad";
import type { EstadoSalida } from "../../../shared/enums/_generic/estado-salida";
import type { EstadoPesaje } from "../../../shared/enums/_generic/estado-pesaje";

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
  conductor_numero_licencia: string;
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
  id_sucursal?: number;
  fecha_hora_inicio_pesaje?: string | null;
  fecha_hora_final_pesaje?: string | null;
  validacion_datos?: any[];
  estado_pesaje: EstadoPesaje;
}
