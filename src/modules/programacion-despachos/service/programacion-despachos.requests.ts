import type { MotivoTraslado } from "../../../shared/enums/_generic/motivo-traslado";
import type { TipoRemitente } from "../../../shared/enums/_generic/tipo-remitente";

// Nota: `tipo_remitente` NO se persiste como columna en `guia_segundo_tramo`.
// El backend la usa para decidir si `id_remitente` va a `id_empresa` o `id_planta_destino`.
// El frontend SIEMPRE debe enviarla cuando envía `id_remitente`.

export interface DTO_CrearGuiaSegundoTramo {
  motivo_traslado: MotivoTraslado | string | null;
  fecha_inicio_traslado: string | null;
  fecha_emision: string | null;
  fecha_en_planta: string | null;
  guia_transportista: string | null;
  guia_remitente: string | null;
  sin_guia_transportista: boolean;
  id_remitente: number | null;
  tipo_remitente: TipoRemitente | "EMPRESA" | "PLANTA_DESTINO" | null;
  documento_guia_remitente: File | null;
  documento_guia_transportista: File | null;
}

export interface DTO_ActualizarGuiaSegundoTramo
  extends Omit<DTO_CrearGuiaSegundoTramo, "documento_guia_remitente" | "documento_guia_transportista"> {
  documento_guia_remitente: File | null;
  documento_guia_transportista: File | null;
  motivo: string | null;
  nombres_evidencias_nuevas?: string[] | null;
  nombres_evidencias_eliminadas?: string[] | null;
}

export interface CrearDespachoRequest {
  id_planta_destino: number;
  id_empresa: number;
  detalles: CrearDespachoDetalleRequest[];
}

export interface CrearDespachoDetalleRequest {
  id_lote_mineral?: number | null;
  id_blending?: number | null;
  peso_tomado: number;
  codigo_preliminar?: string | null;
}

export interface CrearDistribucionRequest {
  id_sucursal: number;
  id_empresa_transporte: number;
  id_vehiculo: number;
  id_empresa_transporte_carreta?: number | null;
  id_vehiculo_carreta?: number | null;
  id_tipo_vehiculo: number;
  id_conductor: number;
  fecha_estimada_llegada?: string | null;
  detalles: CrearDistribucionDetalleRequest[];
}

export interface CrearDistribucionDetalleRequest {
  id_despacho_detalle: number;
  peso_tomado: number;
}

export interface PesarDistribucionDetalleRequest {
  peso_tara?: number | null;
  peso_bruto?: number | null;
  /** true = bloquear tara, false = desbloquear (cascade reset del bruto) */
  confirmar_tara?: boolean | null;
  /** true = bloquear bruto, false = desbloquear (sin cascade) */
  confirmar_bruto?: boolean | null;
}

export interface DespachoFiltros {
  id_planta_destino?: number;
  id_empresa?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

/**
 * DTO para registrar / editar los datos reportados por el cliente al recibir la
 * distribución (peso neto del lote / blending / partición que llegó, código que el
 * cliente asignó, leyes reportadas por el cliente).
 *
 * `fecha_llegada_cliente` es obligatoria. Los campos dentro de `detalles` son
 * opcionales: si no se envían, no se modifican los valores persistidos.
 */
export interface DTO_DatoDetalleCliente {
  id_detalle: number;
  peso_neto_cliente?: number | null;
  codigo_cliente?: string | null;
  ley_oro_cliente?: number | null;
  ley_plata_cliente?: number | null;
  ley_humedad_cliente?: number | null;
}

export interface DTO_DatosCliente {
  fecha_llegada_cliente: string;
  detalles: DTO_DatoDetalleCliente[];
}