export interface RES_Rol {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: string;
}

export interface RES_Modulo {
  id: number;
  id_submenu: number;
  nombre: string;
  path: string;
  estado: string;
}

export interface RES_Submenu {
  id: number;
  id_menu: number;
  nombre: string;
  path: string;
  estado: string;
  modulos: RES_Modulo[];
}

export interface RES_MenuEstructura {
  id: number;
  nombre: string;
  path: string;
  estado: string;
  submenus: RES_Submenu[];
}
