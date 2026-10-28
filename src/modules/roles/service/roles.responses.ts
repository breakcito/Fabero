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
  es_desplegable: boolean;
  estado: string;
}

export interface RES_Submenu {
  id: number;
  id_menu: number;
  nombre: string;
  /** `null` cuando el submenu es un contenedor (es_desplegable). */
  path: string | null;
  es_desplegable: boolean;
  estado: string;
  modulos: RES_Modulo[];
}

export interface RES_MenuEstructura {
  id: number;
  nombre: string;
  /** `null` cuando el menu es un contenedor (es_desplegable). */
  path: string | null;
  es_desplegable: boolean;
  estado: string;
  submenus: RES_Submenu[];
}

/**
 * Permiso de un nodo del arbol de navegacion.
 * - menu    -> acceso directo a un menu hoja
 * - submenu -> acceso directo a un submenu hoja
 * - modulo  -> acceso a un modulo (vista final)
 */
export type RES_PermisoNodo =
  | { tipo: "menu"; id: number }
  | { tipo: "submenu"; id: number }
  | { tipo: "modulo"; id: number };
