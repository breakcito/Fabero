export interface RES_EmpleadoResumen {
  id_empleado: number;
  id_empresa: number;
  empresa: string;
  id_area: number | null;
  area: string | null;
  id_cargo: number | null;
  cargo: string | null;
  nombre: string;
  apellido: string;
  dni: string | null;
  ruc: string | null;
  carnet_extranjeria: string | null;
  pasaporte: string | null;
  fecha_nacimiento: string | null;
  path_foto: string | null;
  estado: string;
}

export interface RES_Area {
  id_area: number;
  nombre: string;
}

export interface RES_Cargo {
  id_cargo: number;
  nombre: string;
}
