export interface DTO_CrearAnticipoProveedor {
  id_proveedor_minero: number;
  serie_factura?: string;
  numero_factura?: string;
  saldo_inicial: number;
  evidencias?: File[];
}

export interface DTO_AnularAnticipoProveedor {
  motivo: string;
}
