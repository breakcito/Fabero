/**
 * Datos estructurados del "Ticket de Ingreso de Vehículos con Carga" (T.I.V.).
 *
 * Alimenta tanto el PDF corporativo (`presentation/utils/ticket-ingreso-vehiculo-pdf`)
 * como su vista previa. Es global porque lo consumen varios módulos:
 * recepción de unidades y programación de recepción.
 *
 * El documento se arma con UN solo proveedor: el elegido por el operador. El
 * backend devuelve `remitente`/`transportista` con los datos de ese
 * proveedor.
 */
export interface RES_TicketIngresoVehiculoData {
  id: number;
  correlativo: string;
  tiv: string;
  numero_correlativo: number | null;
  tipo_ingreso: string | null;
  empresa_fabero: {
    razon_social: string;
    ruc: string;
    domicilio_fiscal: string;
    sede_productiva: string;
  };
  remitente: {
    razon_social: string;
    ruc: string;
    procedencia: string;
    destino: string;
    guia_remitente: string;
    producto: string;
  };
  vehiculo: {
    placa: string;
    marca_tracto: string;
    placa_carreta: string;
    marca_carreta: string;
    subcontratista: string;
  };
  transportista: {
    razon_social: string;
    ruc: string;
    guia_transportista: string;
    conductor_nombre: string;
    licencia: string;
  };
  generales: {
    fecha_ingreso: string;
    hora_ingreso: string;
    fecha_salida: string;
    hora_salida: string;
    peso_guia_tm: number | null;
    peso_vehicular_total_tm: number | null;
  };
  observaciones: string;
}

/**
 * Ticket de Ingreso Vehicular disponible para un proveedor de la carga.
 *
 * Una unidad vehicular puede traer la carga de varios proveedores: cada uno
 * tiene su propio par de guías y, por lo tanto, su propio ticket de ingreso.
 * El operador elige a qué proveedor corresponde el ticket que va a imprimir.
 */
export interface RES_TicketIngresoDisponible {
  id_proveedor: number;
  razon_social: string;
  ruc: string | null;
  /** Guía de primer tramo del proveedor: se envía como `id_guia`. */
  id_guia_primer_tramo: number | null;
  guia_remitente: string | null;
  guia_transportista: string | null;
  peso_guia_remision: number | null;
  peso_vehicular_total: number | null;
  con_no_conformidad: boolean;
}

/**
 * Guía de primer tramo asociada a una recepción de unidad.
 * Cuando una unidad tiene más de una, hay que elegir con cuál se genera el
 * Ticket de Ingreso Vehicular.
 */
export interface GuiaRecepcionItem {
  id: number;
  guia_remitente: string | null;
  guia_transportista: string | null;
  sin_guia_transportista: boolean;
  con_no_conformidad: boolean;
  peso_guia_remision: number;
  peso_vehicular_total: number;
  fecha_emision: string | null;
  created_at: string;
}
