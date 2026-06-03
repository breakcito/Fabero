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
}

export interface RES_Contratista {
  id_contratista: number;
  id_mina: number;
  mina: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  ruc: string | null;
  carnet_extranjeria: string | null;
  pasaporte: string | null;
  fecha_nacimiento: string | null;
  path_foto: string | null;
  estado: string;
  labores_asignadas: string; // "TA-001 | SN-002" o "No aplica"
  ids_labor_asignadas: string | null;
}

export interface RES_Mina {
  id_mina: number;
  nombre: string;
}

export interface RES_Area {
  id_area: number;
  nombre: string;
}

export interface RES_Cargo {
  id_cargo: number;
  nombre: string;
}

export interface RES_Labor {
  id_labor: number;
  correlativo: string;
  nombre: string | null;
}

export interface RES_LaborContratista {
  id_labor_contratista: number;
  id_labor: number;
  correlativo: string;
  nombre: string | null;
}
