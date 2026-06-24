export interface RES_LoteMineral {
  id: number;
  id_recepcion_unidad: number;
  id_proveedor_minero: number | null;
  proveedor_nombre?: string;
  proveedor_telefono?: string;
  id_empleado_registro: number;
  empleado_registro_nombre?: string;
  id_encargado_muestra: number | null;
  encargado_nombre?: string;
  id_zona_origen: number | null;
  zona_origen_nombre?: string;
  correlativo: string;
  numero_correlativo: number;
  tipo_carga: string | null;
  numero_contacto: string | null;
  tipo_producto: string | null;
  tipo_mineral: string | null;
  evidencias: Array<{
    url: string;
    path_relativo: string;
    nombre_original: string;
    extension: string;
  }> | null;
  peso_inicial: number | null;
  fecha_hora_peso_inicial: string | null;
  observacion_peso_inicial: string | null;
  peso_final: number | null;
  fecha_hora_peso_final: string | null;
  observacion_peso_final: string | null;
  peso_neto: number | null;
  id_vehiculo: number | null;
  vehiculo_placa: string | null;
  vehiculo_serie: string | null;
  id_empresa_transporte: number | null;
  empresa_transporte_razon_social: string | null;
  id_tipo_vehiculo: number | null;
  tipo_vehiculo_nombre: string | null;
  id_conductor: number | null;
  conductor_nombre_completo: string | null;
  conductor_dni: string | null;
  created_at: string;
}

export interface RecepcionMineralResponse {
  id: number;
  id_empleado_registro: number;
  empleado_registro_nombre: string;
  id_vehiculo: number | null;
  vehiculo_placa: string | null;
  vehiculo_serie: string | null;
  id_empresa_transporte: number | null;
  empresa_transporte_razon_social: string | null;
  id_tipo_vehiculo: number | null;
  tipo_vehiculo_nombre: string | null;
  id_conductor: number | null;
  conductor_nombre_completo: string | null;
  conductor_dni: string | null;
  tipo_ingreso: string;
  tipo_carga: string;
  segunda_placa: string | null;
  fecha_hora_ingreso: string;
  fecha_hora_salida: string | null;
  fecha_hora_inicio_pesaje: string | null;
  fecha_hora_final_pesaje: string | null;
  evidencias: Array<{
    url: string;
    path_relativo: string;
    nombre_original: string;
    extension: string;
  }> | null;
  observacion: string | null;
  estado: string;
  estado_salida: string | null;
  estado_pesaje: string | null;
  validacion_datos: {
    condicion_ingreso: boolean;
    placa: boolean;
    empresa_transporte: boolean;
    tipo_vehiculo: boolean;
    segunda_placa: boolean;
    conductor: boolean;
  };
  id_sucursal: number | null;
  lotes: RES_LoteMineral[];
}
