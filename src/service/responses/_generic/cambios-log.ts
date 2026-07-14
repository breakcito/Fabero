/**
 * Interface reutilizable para la trazabilidad de los cambios de cualquier modulo.
 */
export interface RES_CambiosLog {
  id_empleado: number;
  // Al editar o eliminar de forma explicita
  motivo: string | null;
  update_at: string;

  // Al editar
  cambios: {
    campo_bd: string | null;
    campo: string | null;
    valor_anterior: unknown;
    valor_nuevo: unknown;
  }[];
}
