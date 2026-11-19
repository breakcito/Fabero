/**
 * Payload del evento de WebSocket que informa que hay una unidad nueva
 * disponible para pesar.
 *
 * Lo emite el backend en `App\Events\UnidadesParaPesarActualizadas`.
 */
export interface EVT_UnidadesParaPesar {
  /**
   * Proceso que originó el cambio:
   * - `recepcion`: ingreso directo de una unidad a planta.
   * - `programacion_recepcion`: se confirmó una programación de recepción.
   * - `programacion_despacho`: se confirmó una programación de despacho.
   */
  origen: "recepcion" | "programacion_recepcion" | "programacion_despacho";
  /** Recepción de unidad afectada. */
  id_recepcion_unidad: number | null;
  /** Sucursal donde quedó disponible la unidad. */
  id_sucursal: number | null;
  /** Tipo de ingreso de la unidad (Recepción de Mineral / Despacho de Mineral). */
  tipo_ingreso: string | null;
  /** Placa del vehículo principal de la unidad. */
  placa: string | null;
}
