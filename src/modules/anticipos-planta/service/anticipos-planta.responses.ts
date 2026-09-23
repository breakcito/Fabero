import type { RES_CambiosLog } from "../../../service/responses/_generic/cambios-log";
import type { IArchivo } from "../../../shared/interfaces/archivo";

export interface RES_AnticipoPlanta {
  id: number;
  id_planta: number;
  planta_ruc: string;
  planta_razon_social: string;
  id_empleado_registro: number;
  empleado_registro_nombre: string;
  codigo_comprobante: string | null;
  saldo_inicial: number;
  saldo_actual: number;
  evidencias: (IArchivo | string)[];
  log_cambios: RES_CambiosLog[];
  estado: string;
  created_at: string;
}
