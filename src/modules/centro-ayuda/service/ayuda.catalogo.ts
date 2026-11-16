import {
  IconAdjustmentsHorizontal,
  IconArrowsExchange,
  IconCalendarPlus,
  IconChartBar,
  IconCoin,
  IconCoins,
  IconFileDescription,
  IconFlask,
  IconNotes,
  IconReceipt,
  IconScale,
  IconScaleOutline,
  IconTruckDelivery,
  IconTruckLoading,
} from "@tabler/icons-react";
import manifiesto, { type IArchivoAyuda } from "virtual:ayuda-videos";
import type { IModuloAyuda, IconoModuloAyuda } from "./ayuda.responses";

/**
 * Catálogo del Centro de Ayuda.
 *
 * Los videos NO se versionan en el código: viven en
 * `public/videos/ayuda/<carpeta-del-modulo>/` y se sirven como archivos
 * estáticos. Para agregar un tutorial basta con soltar el archivo en la carpeta
 * del módulo: el plugin `fabero:ayuda-videos` de `vite.config.ts` arma el
 * listado y la app lo consume sin tocar nada.
 *
 * Estructura de la carpeta:
 *
 *   public/videos/ayuda/
 *     programacion de recepcion/
 *       programacion de unidad - registro.mp4   <- el video
 *       programacion de unidad - registro.jpg   <- thumbnail (opcional)
 *     recepcion de unidades/
 *     ...
 *
 * ORDEN DE LOS VIDEOS: se controla desde este catálogo, no por el orden en que
 * los archivos aparecen en la carpeta. Se agrega un parámetro `numero`:
 *
 *   videos: [
 *     { numero: 1, archivo: "guias primer tramo registro", titulo: "Registrar la guía" },
 *     { numero: 2, archivo: "guias primer tramo edicion", titulo: "Editar la guía" },
 *   ]
 *
 * El `numero` define en qué posición se muestra el video. El `archivo` es el
 * nombre del archivo: si hay un archivo con ese nombre se usa; si no, el video
 * toma el siguiente archivo de la carpeta que esté libre.
 *
 * Sin `numero`, el orden es el de declaración y cada video toma el siguiente
 * archivo de la carpeta (orden natural por nombre). Como atajo, `archivo`
 * también admite un prefijo numérico que actúa como posición
 * (`"01 guias primer tramo registro"`), pero el parámetro `numero` tiene
 * prioridad.
 */

interface IVideoDefinido {
  /** Posición del video dentro del módulo (opcional). */
  numero?: number;
  /**
   * Nombre base esperado del archivo (opcional). Si no hay un archivo con ese
   * nombre, el video toma el siguiente de la carpeta que esté libre.
   */
  archivo?: string;
  titulo: string;
}

interface IModuloDefinido {
  slug: string;
  /** Carpeta dentro de `videos/ayuda`. Si se omite, se deriva del slug. */
  carpeta?: string;
  nombre: string;
  descripcion: string;
  icono: IconoModuloAyuda;
  videos: IVideoDefinido[];
}

const DEFINICION_MODULOS: IModuloDefinido[] = [
  {
    slug: "programacion-recepcion",
    carpeta: "programacion de recepcion",
    nombre: "Programación de Recepción",
    descripcion: "Agendar la llegada de un transporte y confirmar su ingreso a planta.",
    icono: IconCalendarPlus,
    videos: [
      { numero: 1, archivo: "programacion de unidad - registro", titulo: "Programación de unidad - Registro" },
    ],
  },
  {
    slug: "recepcion-unidades",
    carpeta: "recepcion de unidades",
    nombre: "Recepción de Unidades",
    descripcion: "Ingreso y salida de vehículos con su ticket de balanza.",
    icono: IconTruckDelivery,
    videos: [
      { numero: 1, archivo: "recepcion de unidad registro", titulo: "Recepción de unidad para recepción de mineral" },
      { numero: 2, archivo: "recepcion de unidad confirmacion", titulo: "Recepción de unidad confirmación de programación" },
      { numero: 3, archivo: "recepcion de unidad despacho", titulo: "Recepción de unidad para despacho de mineral" },
      { numero: 4,  titulo: "Registro de salida del vehículo" },
    ],
  },
  {
    slug: "balanza-pesaje-recepcion-mineral",
    carpeta: "balanza pesaje recepcion de mineral",
    nombre: "Pesaje - Recepción de Mineral",
    descripcion: "Pesaje en balanza, creación de lote y pesaje final.",
    icono: IconScale,
    videos: [
      { numero: 1, archivo: "balanza pesaje de lotes", titulo: "Pesaje de lotes" },
    ],
  },
  {
    slug: "validacion-distribucion",
    carpeta: "validacion y distribucion",
    nombre: "Validación y Distribución",
    descripcion: "Evaluar un lote y distribuirlo entre las plantas de destino.",
    icono: IconArrowsExchange,
    videos: [
      { numero: 1, titulo: "Validar un lote para despacho" },
      { numero: 2, titulo: "Crear las particiones de la distribución" },
      { numero: 3, titulo: "Registrar el peso y el ticket de la distribución" },
    ],
  },
  {
    slug: "primer-tramo-guias",
    carpeta: "primer tramo gestion de guias",
    nombre: "Primer Tramo - Gestión de Guías",
    descripcion: "Guías de ingreso: del proveedor hasta el portón de la planta.",
    icono: IconFileDescription,
    videos: [
      { numero: 1, archivo: "guias primer tramo registro", titulo: "Registrar la guía del primer tramo" },
    ],
  },
  {
    slug: "cierre-leyes",
    carpeta: "cierre de leyes",
    nombre: "Cierre de Leyes",
    descripcion: "Análisis de laboratorio, grupos y cierre de leyes por lote.",
    icono: IconFlask,
    videos: [
      { numero: 1, archivo: "cierre de leyes registro", titulo: "Registrar las leyes del grupo de análisis" },
      { numero: 2, archivo: "cierre de leyes registro de muestras y asociacion", titulo: "Crear y asociar muestras externas a un grupo" },
    ],
  },
  {
    slug: "valorizacion-compra",
    carpeta: "valorizacion de compra",
    nombre: "Valorización de Compra",
    descripcion: "Calcular y aprobar el monto a pagar al proveedor minero.",
    icono: IconChartBar,
    videos: [
      { numero: 1, archivo: "valorizacion de compra registro de propuesta", titulo: "Crear una propuesta de valorización" },
      { numero: 2, archivo: "valorizacion de compra clonar propuesta", titulo: "Clonar y editar una valorización" },
      { numero: 3, archivo: "valorizacion de compra aprobar propuesta", titulo: "Aprobar la propuesta del lote" },
     
    ],
  },
  {
    slug: "contabilidad-compra-mineral",
    carpeta: "contabilidad compra de mineral",
    nombre: "Contabilidad - Compra de Mineral",
    descripcion: "Comprobantes de compra, aprobaciones, pagos y notas.",
    icono: IconReceipt,
    videos: [
      { numero: 1, archivo: "contabilidad de compra registro de comprobante",titulo: "Registrar el comprobante de compra" },
      
      { numero: 2, archivo: "contabilidad de compra registro de pagos",titulo: "Registrar pagos parciales y totales" },
    
    ],
  },
  {
    slug: "blending",
    carpeta: "blending",
    nombre: "Blending",
    descripcion: "Combinar lotes para obtener la ley objetivo de una planta.",
    icono: IconAdjustmentsHorizontal,
    videos: [
      { numero: 1, titulo: "Crear un blending con su ley objetivo" },
     
    ],
  },
  {
    slug: "programacion-despacho",
    carpeta: "programacion de despacho",
    nombre: "Programación de Despacho",
    descripcion: "Despachar mineral a la planta destino y registrar la llegada del cliente.",
    icono: IconTruckLoading,
    videos: [
      { numero: 1, archivo: "programacion de despacho registro de despacho", titulo: "Programar un despacho a la planta destino" },
      { numero: 2, archivo: "programacion de despacho registro de distribucion",titulo: "Crear distribuciones" },
      
    ],
  },
  {
    slug: "balanza-pesaje-despacho-mineral",
    carpeta: "balanza pesaje despacho mineral",
    nombre: "Pesaje - Despacho de Mineral",
    descripcion: "Balanza de salida: pesaje del mineral despachado.",
    icono: IconScaleOutline,
    videos: [
      { numero: 1, archivo: "balanza pesaje de lotes de despacho", titulo: "Registrar el peso de despacho" },

    ],
  },
  {
    slug: "segundo-tramo-guias",
    carpeta: "segundo tramo gestion de guias",
    nombre: "Segundo Tramo - Gestión de Guías",
    descripcion: "Guías de embarque hacia la planta de destino.",
    icono: IconNotes,
    videos: [
      { numero: 1, archivo:"guias segundo tramo registro",  titulo: "Registrar la guía del segundo tramo" },

    ],
  },
  {
    slug: "valorizacion-venta",
    carpeta: "valorizacion de venta",
    nombre: "Valorización de Venta",
    descripcion: "Calcular y aprobar el monto a cobrar a la planta destino.",
    icono: IconCoins,
    videos: [
      { numero: 1, titulo: "Crear la valorización de venta" },
      { numero: 2, titulo: "Aprobar la valorización de venta" },
    ],
  },
  {
    slug: "contabilidad-venta-mineral",
    carpeta: "contabilidad venta de mineral",
    nombre: "Contabilidad - Venta de Mineral",
    descripcion: "Comprobantes de venta, anticipos de planta y pagos.",
    icono: IconCoin,
    videos: [
      { numero: 1, titulo: "Registrar el comprobante de venta" },
      { numero: 2, titulo: "Aplicar anticipos de planta" },
      { numero: 3, titulo: "Registrar los pagos del comprobante" },
    ],
  },
];

/**
 * Normaliza un nombre de carpeta/archivo para comparar sin tildes ni espacios.
 */
const normalizar = (texto: string): string =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Título deducido del nombre del archivo, para videos sin título en el catálogo. */
const tituloDesdeArchivo = (base: string): string => {
  // Quita el sufijo de cámara tipo "- IMG_0159" y capitaliza la primera letra.
  const limpio = base
    .replace(/[\s_-]*[-_]?\s*IMG[_\s-]?\d+\s*$/i, "")
    .replace(/[\s_-]+$/, "")
    .trim();
  if (! limpio) return base;
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
};

/** Prefijo numérico: "01 algo", "1 - algo", "3.algo". */
const PREFIJO_NUMERICO = /^(\d+)\s*[-.\s]\s*(.*)$/s;

/** Separa la posición (opcional) del nombre de archivo. */
const separarOrdenYBase = (archivo?: string): { orden: number | null; base: string } => {
  const texto = (archivo ?? "").trim();
  if (! texto) return { orden: null, base: "" };
  const coincidencia = texto.match(PREFIJO_NUMERICO);
  if (! coincidencia) return { orden: null, base: texto };
  return { orden: Number(coincidencia[1]), base: coincidencia[2].trim() };
};

const construirModulo = (definicion: IModuloDefinido): IModuloAyuda => {
  const carpeta = normalizar(definicion.carpeta ?? definicion.slug);
  const archivos: IArchivoAyuda[] = manifiesto[carpeta] ?? [];

  // 1) Cada entrada del catálogo queda con su posición y su nombre de archivo.
  const entradas = definicion.videos.map((video, indice) => {
    const prefijo = separarOrdenYBase(video.archivo);
    return {
      titulo: video.titulo,
      // El parámetro `numero` tiene prioridad sobre el prefijo numérico.
      numero: video.numero ?? prefijo.orden ?? indice + 1,
      base: prefijo.base,
    };
  });

  // 2) Se ordenan por número (las entradas sin número quedan donde están).
  const ordenadas = [...entradas].sort((a, b) => a.numero - b.numero);

  // 3) Cada entrada toma su archivo: primero el que coincide por nombre y,
  //    si no hay, el siguiente de la carpeta que todavía esté libre.
  const libres = new Set(archivos.map((archivo) => archivo.base));
  const asignados: { archivo: IArchivoAyuda; titulo: string }[] = [];

  for (const entrada of ordenadas) {
    let archivo: IArchivoAyuda | undefined;

    if (entrada.base) {
      const coincide = archivos.find(
        (a) => libres.has(a.base) && normalizar(a.base) === normalizar(entrada.base),
      );
      if (coincide) archivo = coincide;
    }
    if (!archivo) {
      archivo = archivos.find((a) => libres.has(a.base));
    }
    if (!archivo) continue;

    libres.delete(archivo.base);
    asignados.push({
      archivo,
      titulo: entrada.titulo || tituloDesdeArchivo(archivo.base),
    });
  }

  // 4) Archivos que no están en el catálogo: se listan al final, con el título
  //    deducido del nombre.
  for (const archivo of archivos) {
    if (!libres.has(archivo.base)) continue;
    libres.delete(archivo.base);
    asignados.push({
      archivo,
      titulo: tituloDesdeArchivo(archivo.base),
    });
  }

  return {
    slug: definicion.slug,
    nombre: definicion.nombre,
    descripcion: definicion.descripcion,
    icono: definicion.icono,
    videos: asignados.map(({ archivo, titulo }) => ({
      archivo: archivo.base,
      titulo,
      url: archivo.url,
      poster: archivo.poster,
    })),
  };
};

/** Catálogo completo, con las URLs ya resueltas. */
export const CATALOGO_AYUDA: IModuloAyuda[] = DEFINICION_MODULOS.map(construirModulo);

/** Carpetas donde hay que soltar los videos de cada módulo. */
export const CARPETAS_MODULOS = DEFINICION_MODULOS.map(
  (definicion) => definicion.carpeta ?? definicion.slug,
);

/** Total de videos disponibles (uno por archivo encontrado en las carpetas). */
export const TOTAL_VIDEOS_DISPONIBLES = CATALOGO_AYUDA.reduce(
  (total, modulo) => total + modulo.videos.length,
  0,
);
