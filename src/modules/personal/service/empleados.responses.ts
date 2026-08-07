export interface RES_EmpleadoResumen {
  id_empleado: number;
  id_empresa: number;
  empresa: string;
  id_cargo: number;
  cargo: string;
  id_area: number;
  area: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  ruc: string | null;
  carnet_extranjeria: string | null;
  pasaporte: string | null;
  fecha_nacimiento: string | null;
  path_foto: string | null;
  estado: string;
  autoriza_ingreso_unidades: boolean;
}

export interface RES_Area {
  id_area: number;
  nombre: string;
}

export interface RES_Cargo {
  id_cargo: number;
  nombre: string;
}
