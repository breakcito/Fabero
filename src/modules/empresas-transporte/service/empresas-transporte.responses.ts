import type { EstadoBase } from "../../../shared/enums/_generic/estado-base";
import type { TipoEntidad } from "../../../shared/enums/_generic/tipo-entidad";

export interface EmpresaTransporteResponse {
  id: number;
  tipo_entidad: TipoEntidad;
  dni: string | null;
  ruc: string;
  razon_social: string;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  estado: EstadoBase;
}
