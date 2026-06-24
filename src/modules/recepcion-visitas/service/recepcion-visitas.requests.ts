export interface VisitorPayload {
  id_visitante?: number; // si ya existe
  nombre?: string;       // si es nuevo
  apellido?: string;     // si es nuevo
  dni?: string;          // si es nuevo
  telefono?: string;     // si es nuevo
  foto_documento?: File[]; // archivos adjuntos
}

export interface CrearRecepcionVisitaRequest {
  id_empleado_contacto: number;
  id_motivo_ingreso: number;
  observacion?: string;
  con_vehiculo: boolean;
  serie_placa?: string;
  numero_placa?: string;
  visitantes: VisitorPayload[];
}

export interface RecepcionVisitaFilters {
  fecha_inicio?: string; // yyyy-mm-dd
  fecha_fin?: string;    // yyyy-mm-dd
}
