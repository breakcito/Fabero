export interface RES_Menu {
  id_menu: number;
  nombre: string;
  submenus: RES_Submenu[];
  path: string;
}

export interface RES_Submenu {
  id_submenu: number;
  nombre: string;
  modulos: RES_Modulo[];
  path: string;
}

export interface RES_Modulo {
  id_modulo: number;
  nombre: string;
  url: string;
}
