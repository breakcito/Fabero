import type { RES_CambiosLog } from "../../../service/responses/_generic/cambios-log";
import type { IArchivo } from "../../../shared/interfaces/archivo";

export interface RES_TransaccionAnticipoPlanta {
  id: number;
  id_anticipo_planta: number;
  id_comprobante_venta: number;
  comprobante_codigo: string;
  comprobante_fecha_emision?: string | null;
  monto_retirado: number;
  saldo_actual: number;
  log_cambios: RES_CambiosLog[];
  estado: string;
  created_at: string;
}

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
  transacciones?: RES_TransaccionAnticipoPlanta[];
  estado: string;
  created_at: string;
}
