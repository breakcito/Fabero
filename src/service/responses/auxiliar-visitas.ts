export interface RES_MotivoIngreso {
  id_motivo_ingreso: number;
  nombre: string;
}

export interface RES_Visitante {
  id_visitante: number;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string | null;
}
