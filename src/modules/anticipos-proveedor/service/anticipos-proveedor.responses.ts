import type { RES_CambiosLog } from "../../../service/responses/_generic/cambios-log";
import type { IArchivo } from "../../../shared/interfaces/archivo";

export interface RES_AnticipoProveedor {
  id: number;
  id_proveedor_minero: number;
  proveedor_nombre: string;
  id_empleado_registro: number;
  empleado_registro_nombre: string;
  serie_factura: string | null;
  numero_factura: string | null;
  saldo_inicial: number;
  saldo_actual: number;
  evidencias: (IArchivo | string)[];
  log_cambios: RES_CambiosLog[];
  estado: string;
  created_at: string;
}
