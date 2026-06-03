export interface RES_Area {
  id_area: number;
  nombre: string;
  estado: string;
  cantidad_cargos: number;
  nombres_cargos?: string;
}

export interface RES_Cargo {
  id_cargo: number;
  nombre: string;
  estado: string;
  id_area: number;
  area_nombre: string;
}
