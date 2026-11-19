import type { RES_Permiso } from "../../../shared/interfaces/permiso";

export interface RES_Usuario {
  id_usuario: number;
  id_rol: number;
  id_empleado: number;
  nombre: string;
  apellido: string;
  dni: string;
  ruc: string;
  carnet_extranjeria: string;
  pasaporte: string;
  fecha_nacimientto: string;
  path_foto: string;
  /**
   * Permisos específicos del usuario. Array vacío = sin restricciones
   * adicionales (solo manda el rol).
   */
  permisos: RES_Permiso[];
}

// Respuesta del endpoint
export interface RES_Login {
  token: string;
  usuario: RES_Usuario;
}
