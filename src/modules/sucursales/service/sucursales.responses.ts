export interface RES_Sucursal {
  id_sucursal: number;
  nombre: string;
  id_departamento: number | null;
  departamento: string | null;
  id_provincia: number | null;
  provincia: string | null;
  id_distrito: number | null;
  distrito: string | null;
  direccion: string | null;
  telefono: string | null;
  estado: string;
}

export interface RES_Departamento {
  id: number;
  nombre: string;
  codigo: string;
}

export interface RES_Provincia {
  id: number;
  id_departamento: number;
  nombre: string;
  codigo: string;
}

export interface RES_Distrito {
  id: number;
  id_provincia: number;
  nombre: string;
  codigo: string;
}
