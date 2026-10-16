export interface RES_TipoCambio {
  id: number;
  id_empleado_registro?: number;
  empleado_registro_nombre?: string;
  valor_compra: number;
  valor_venta: number;
  fecha: string;
  created_at?: string;
  estado?: string;
}

export interface REQ_CrearTipoCambio {
  valor_compra: number;
  valor_venta: number;
  fecha: string;
}

export interface RES_TipoCambioVigenteResponse {
  fecha_consultada: string;
  registrado_hoy: boolean;
  tipo_cambio_hoy: RES_TipoCambio | null;
  ultimo_historico: RES_TipoCambio | null;
}
