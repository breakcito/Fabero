export interface RES_Menu {
  id_menu: number;
  nombre: string;
  /** Ruta del nodo. `null` cuando el menu es un contenedor (es_desplegable). */
  path: string | null;
  /** true => contenedor expandible; false => hoja navegable (Link directo). */
  es_desplegable: boolean;
  submenus: RES_Submenu[];
}

export interface RES_Submenu {
  id_submenu: number;
  nombre: string;
  /** Ruta del nodo. `null` cuando el submenu es un contenedor (es_desplegable). */
  path: string | null;
  es_desplegable: boolean;
  modulos: RES_Modulo[];
}

export interface RES_Modulo {
  id_modulo: number;
  nombre: string;
  /** Ruta de la vista: `/<path>`. */
  path: string;
  es_desplegable: boolean;
  tags?: string[];
}
