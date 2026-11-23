import type { IArchivo } from "./archivo";

/**
 * Archivos de guía de una PROGRAMACIÓN (antes de existir la columna JSON
 * `documentos_programacion` en `recepcion_unidad`).
 *
 * @deprecated La columna `documentos_programacion` fue eliminada. Los archivos
 *             de cada proveedor viven ahora dentro de su entrada del array
 *             `guias` (ver `IGuiaRecepcion`). Se mantiene el tipo porque
 *             `programar-recepcion`, `validacion-distribucion` y
 *             `recepcion-unidades` todavía lo importan mientras se adaptan
 *             al modelo nuevo.
 */
export interface IDocumentoProgramacion {
  guia_remitente: IArchivo | null;
  guia_transportista: IArchivo | null;
}
