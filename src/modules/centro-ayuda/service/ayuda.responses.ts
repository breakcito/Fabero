import type { IconCalendarPlus } from "@tabler/icons-react";

/**
 * Todos los iconos Tabler comparten la misma firma, asi que se tipa contra uno
 * cualquiera para no depender de un export de tipo que el paquete no expone.
 */
export type IconoModuloAyuda = typeof IconCalendarPlus;

/**
 * Video de ayuda.
 *
 * El archivo y su thumbnail se resuelven en el modulo virtual
 * `virtual:ayuda-videos` (plugin `fabero:ayuda-videos` de `vite.config.ts`),
 * que lista lo que hay en `public/videos/ayuda/<carpeta>/`. Un video solo
 * entra al catalogo si su archivo existe, asi que `url` siempre esta presente.
 */
export interface IVideoAyuda {
  /** Nombre base del archivo (sin extension). */
  archivo: string;
  titulo: string;
  descripcion?: string;
  /** URL publica del video. */
  url: string;
  /** URL del thumbnail, o null si el modulo no trae imagen. */
  poster: string | null;
}

/** Modulo del ERP con sus videos de ayuda. */
export interface IModuloAyuda {
  slug: string;
  nombre: string;
  descripcion: string;
  icono: IconoModuloAyuda;
  videos: IVideoAyuda[];
}
