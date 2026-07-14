export interface CrearGrupoPayload {
  nombre: string;
  orden: number;
  indicar_origen: boolean;
  analitos: {
    id_analito: number;
    para_valorizacion_oro: boolean;
    para_valorizacion_plata: boolean;
    para_valorizacion_humedad: boolean;
    para_valorizacion_recuperacion: boolean;
  }[];
}
