/**
 * Modulo virtual generado por el plugin `fabero:ayuda-videos` (ver
 * `vite.config.ts`). Lista los videos del Centro de Ayuda que hay en
 * `public/videos/ayuda/<carpeta>/`.
 */
declare module "virtual:ayuda-videos" {
  export interface IArchivoAyuda {
    /** Nombre base del archivo (sin extension). */
    base: string;
    /** URL publica del video. */
    url: string;
    /** URL publica del thumbnail, o null si el modulo no trae imagen. */
    poster: string | null;
  }
  /** Archivos por carpeta normalizada: `{ "programacion-de-recepcion": [...] }` */
  const manifiesto: Record<string, IArchivoAyuda[]>;
  export default manifiesto;
}

declare module "uuid" {
  export const NIL: string;
  export const MAX: string;
  export const parse: (uuid: string) => readonly number[];
  export const stringify: (
    arr: readonly number[] | Uint8Array,
    offset?: number,
  ) => string;
  export const v1: (
    options?: V1Options | null,
    buffer?: readonly number[] | Uint8Array,
    offset?: number,
  ) => string;
  export const v3: (
    name: string | readonly number[] | Uint8Array,
    namespace: string | readonly number[],
    buffer?: readonly number[] | Uint8Array,
    offset?: number,
  ) => string;
  export const v4: (
    options?: V4Options | null,
    buffer?: readonly number[] | Uint8Array,
    offset?: number,
  ) => string;
  export const v5: (
    name: string | readonly number[] | Uint8Array,
    namespace: string | readonly number[],
    buffer?: readonly number[] | Uint8Array,
    offset?: number,
  ) => string;
  export const validate: (uuid: string) => boolean;
  export const version: (uuid: string) => number;

  interface V1Options {
    node?: readonly number[];
    clockseq?: number;
    msecs?: number | Date;
    nsecs?: number;
  }
  interface V4Options {
    random?: readonly number[];
    rng?: () => readonly number[] | Uint8Array;
  }
}
