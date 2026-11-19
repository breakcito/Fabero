import type { CuentaBancariaItem } from "../../../shared/interfaces/cuenta-bancaria";
import type { RES_Permiso } from "../../../shared/interfaces/permiso";

export interface RES_Cuenta {
  id_usuario: number;
  username: string;
  estado: string;
  id_rol: number;
  id_empleado: number;
  nombre_rol: string;
  nombre_empleado: string;
  apellido_empleado: string;
  id_empresa_pertenece: number;
  path_foto: string | null;
  empresa_pertenece: string;
  sucursales: number[];
  permisos: RES_Permiso[];
}

export interface RES_RolDisponible {
  id: number;
  nombre: string;
}

export type CuentaBancariaResponse = CuentaBancariaItem;
