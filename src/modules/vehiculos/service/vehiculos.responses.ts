import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";

export interface VehiculoResponse {
  id: number;
  id_marca: number;
  marca_nombre: string;
  id_empresa_transporte: number;
  empresa_transporte_razon_social: string;
  empresa_transporte_ruc: string;
  id_tipo_vehiculo: number;
  tipo_vehiculo_nombre: string;
  serie_placa: string | null;
  numero_placa: string;
  numero_constancia_mtc: string | null;
  capacidad: number;
  tara: number;
  largo: number | null;
  ancho: number | null;
  alto: number | null;
  estado: EstadoBase;
}
