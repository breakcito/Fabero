export interface DTO_CrearAnticipoPlanta {
  id_planta: number;
  codigo_comprobante?: string;
  saldo_inicial: number;
  evidencias?: File[];
}

export interface DTO_AnularAnticipoPlanta {
  motivo: string;
}
