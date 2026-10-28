/**
 * Mapeo de etiquetas (tags) operativas y de negocio por módulo o URL.
 * Permite que las búsquedas del usuario relacionen términos coloquiales o de
 * negocio con el módulo correcto aunque el título no coincida de forma literal.
 */
export const MODULO_TAGS_MAP: Record<string, string[]> = {
  // --- Configuración / Empresa ---
  empresas: [
    "empresa",
    "razon social",
    "ruc",
    "corporativo",
    "entidad",
    "organizacion",
    "companía",
    "sociedad",
    "cliente",
  ],
  sucursales: [
    "sucursal",
    "establecimiento",
    "filial",
    "sede",
    "local",
    "planta",
    "almacen",
    "ubicacion",
  ],

  // --- Configuración / Personal y Usuarios ---
  personal: [
    "personal",
    "empleado",
    "trabajador",
    "operador",
    "rrhh",
    "recursos humanos",
    "obrero",
    "ingeniero",
    "plantilla",
  ],
  areas_cargos: [
    "area",
    "cargo",
    "puesto",
    "organigrama",
    "estructura",
    "organizacion",
    "departamento",
  ],
  trabajadores: [
    "trabajador",
    "personal",
    "empleado",
    "rrhh",
    "planilla",
    "operador",
  ],
  "encargados-muestra": [
    "encargado",
    "muestra",
    "responsable",
    "laboratorio",
    "coordinador",
  ],
  usuarios: [
    "usuario",
    "cuenta",
    "acceso",
    "login",
    "password",
    "clave",
    "seguridad",
    "rol",
    "permisos",
    "perfil",
  ],
  roles: [
    "rol",
    "permiso",
    "perfil",
    "seguridad",
    "acceso",
    "privilegios",
    "grupo",
  ],
  cuentas: [
    "cuenta",
    "usuario",
    "acceso",
    "login",
    "password",
    "credencial",
  ],

  // --- Configuración / Socios Comerciales ---
  "socios-comerciales": [
    "proveedor",
    "cliente",
    "socio",
    "comercial",
    "tercero",
    "ruc",
    "contacto",
    "compras",
  ],
  "proveedores-mineros": [
    "proveedor",
    "minero",
    "socio",
    "comercial",
    "ruc",
    "contacto",
    "tercero",
    "ventas",
  ],
  "plantas-destino": [
    "planta",
    "destino",
    "cliente",
    "beneficiario",
    "receptor",
    "planta de tratamiento",
  ],
  "empresas-transporte": [
    "transportista",
    "transporte",
    "flota",
    "empresa",
    "via",
    "envio",
  ],
  "condiciones-comerciales-proveedor": [
    "condicion",
    "comercial",
    "proveedor",
    "contrato",
    "precio",
    "tarifa",
    "condiciones",
  ],
  "condiciones-comerciales-planta": [
    "condicion",
    "comercial",
    "planta",
    "contrato",
    "precio",
    "tarifa",
    "condiciones",
  ],
  transporte: [
    "transporte",
    "flota",
    "via",
    "logistica",
    "envio",
    "vehiculos",
  ],
  conductores: [
    "conductor",
    "chofer",
    "driver",
    "personal",
    "transporte",
  ],
  vehiculos: [
    "vehiculo",
    "unidad",
    "camion",
    "placa",
    "flota",
    "auto",
    "carreta",
  ],

  // --- Operaciones / Vigilancia ---
  vigilancia: [
    "vigilancia",
    "control",
    "recepcion",
    "seguridad",
    "ingreso",
    "salida",
    "portico",
  ],
  "recepcion-unidades": [
    "recepcion",
    "unidad",
    "pesaje",
    "ticket",
    "balanza",
    "ingreso",
    "camion",
    "control",
  ],
  "recepcion-visitas": [
    "visita",
    "visitante",
    "recepcion",
    "ingreso",
    "seguridad",
    "portico",
  ],
  "programar-recepcion": [
    "programar",
    "programacion",
    "recepcion",
    "cita",
    "agenda",
    "calendar",
  ],

  // --- Operaciones / Balanza ---
  balanza: [
    "balanza",
    "peso",
    "pesaje",
    "ticket",
    "mineral",
    "lote",
    "control",
  ],
  "recepcion-mineral": [
    "recepcion",
    "mineral",
    "lote",
    "peso",
    "balanza",
    "ingreso",
    "planta",
  ],
  "validacion-distribucion": [
    "validacion",
    "distribucion",
    "reparto",
    "control",
    "mineral",
    "lote",
  ],
  "resumen-balanza": [
    "resumen",
    "balanza",
    "peso",
    "reporte",
    "consolidado",
    "control",
  ],

  // --- Operaciones / Guias y Leyes ---
  guias: [
    "guia",
    "documento",
    "traslado",
    "viaje",
    "remision",
    "despacho",
  ],
  "primer-tramo": [
    "primer tramo",
    "guia",
    "viaje",
    "traslado",
    "despacho",
    "ruta",
  ],
  leyes: [
    "ley",
    "analisis",
    "laboratorio",
    "muestra",
    "ensayo",
    "quimica",
    "mineral",
  ],
  "cierre-leyes": [
    "cierre",
    "ley",
    "analisis",
    "laboratorio",
    "periodo",
    "balance",
  ],

  // --- Operaciones / Anticipos ---
  anticipos: [
    "anticipo",
    "adelanto",
    "credito",
    "pago",
    "saldo",
    "deuda",
  ],
  "anticipos-proveedor": [
    "anticipo",
    "proveedor",
    "adelanto",
    "pago",
    "saldo",
  ],
  "anticipos-planta": [
    "anticipo",
    "planta",
    "adelanto",
    "pago",
    "saldo",
  ],

  // --- Operaciones / Valorizacion, Contabilidad, Blending, Despacho ---
  valorizacion: [
    "valorizacion",
    "precio",
    "costo",
    "tarifa",
    "valor",
    "facturacion",
  ],
  compra: [
    "compra",
    "valorizacion",
    "precio",
    "costo",
    "proveedor",
  ],
  venta: [
    "venta",
    "valorizacion",
    "precio",
    "cliente",
    "planta",
  ],
  contabilidad: [
    "contabilidad",
    "contable",
    "asiento",
    "libro",
    "mayor",
    "factura",
    "pago",
  ],
  blending: [
    "blending",
    "mezcla",
    "proceso",
    "planta",
    "dosificacion",
    "calidad",
  ],
  despacho: [
    "despacho",
    "programacion",
    "ruta",
    "viaje",
    "salida",
    "camion",
  ],
  programacion: [
    "programacion",
    "programa",
    "despacho",
    "ruta",
    "viaje",
    "agenda",
  ],

  // --- Sistema ---
  sistema: ["sistema", "configuracion", "administracion", "parametros"],
  system: [
    "sistema",
    "configuracion",
    "administracion",
    "menu",
    "navegacion",
    "arbol",
    "permisos",
  ],
};

export type TagsModulo = string[];

/**
 * Obtiene las etiquetas asociadas a un módulo buscando por su URL, path o nombre.
 */
export const getTagsParaModulo = (
  urlOrName: string,
  extraTags?: string[],
): TagsModulo => {
  if (!urlOrName) return extraTags || [];

  const lower = urlOrName.toLowerCase();
  const tagsSet = new Set<string>(extraTags || []);

  Object.entries(MODULO_TAGS_MAP).forEach(([key, tags]) => {
    if (lower.includes(key)) {
      tags.forEach((t) => tagsSet.add(t));
    }
  });

  return Array.from(tagsSet);
};
