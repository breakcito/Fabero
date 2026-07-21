export interface DTO_CrearCondicionComercial {
  id_proveedor_minero: number;
  ley_auoz_inicio: number;
  ley_auoz_fin: number;
  maquila: number;
  recuperacion: number;
  consumo: number;
  riesgo_comercial: number;
}

export interface DTO_ActualizarCondicionComercial {
  ley_auoz_inicio: number;
  ley_auoz_fin: number;
  maquila: number;
  recuperacion: number;
  consumo: number;
  riesgo_comercial: number;
}
