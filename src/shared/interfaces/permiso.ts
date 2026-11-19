/**
 * Permiso específico de un usuario.
 *
 * Se aplica ENCIMA de los permisos por rol (menu / submenu / modulo).
 * Si el usuario no tiene entradas en `usuario.permisos`, no tiene restricciones
 * adicionales: solo manda su rol.
 */
export interface RES_Permiso {
  codigo: string;
  nombre: string;
  decision: boolean;
}

/** Entrada del catálogo de permisos disponibles. */
export interface RES_PermisoCatalogo {
  codigo: string;
  nombre: string;
  grupo: string;
}
