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
